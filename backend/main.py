from fastapi import FastAPI, File, Form, UploadFile, Depends, HTTPException, status, Header
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import asyncio
import uuid
import json
from pydantic import BaseModel
from agent import generate_explanation, chat_with_assistant, validate_mri
from report import generate_pdf_report
from fastapi.security import OAuth2PasswordBearer
from typing import List, Optional
import uvicorn
try:
    import torch
    import torch.nn as nn
    import torchvision.models as models
    from torchvision import transforms
    HAS_TORCH = True
except Exception as e:
    print(f"[WARNING] PyTorch not available ({e}). Running server without vision inference.", flush=True)
    torch = None
    nn = None
    models = None
    transforms = None
    HAS_TORCH = False
import numpy as np
from PIL import Image
import io
import os
import cv2
import base64
from datetime import datetime, timedelta, timezone
import jwt
from jwt.exceptions import InvalidTokenError as JWTError
from bson import ObjectId
import joblib
import math

# Local imports
from database import connect_to_mongo, close_mongo_connection, get_database
from auth import (
    verify_clerk_token,
    sync_clerk_user
)
from models import (
    UserCreate, 
    UserLogin, 
    GoogleLoginRequest,
    Token, 
    UserOut, 
    UserSettings,
    HistoryItem, 
    UserUpdate,
    ClinicalRequest,
    ClinicalResponse
)

# app initialized later with lifespan

class NativeSwinGradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.target_layer = target_layer
        self.activations = None
        self.gradients = None
        
        # Register hooks
        self.fh = self.target_layer.register_forward_hook(self.save_activation)
        self.bh = self.target_layer.register_full_backward_hook(self.save_gradient)
        
    def remove_hooks(self):
        self.fh.remove()
        self.bh.remove()
        
    def save_activation(self, module, input, output):
        self.activations = output
        
    def save_gradient(self, module, grad_input, grad_output):
        # grad_output[0] is the gradient w.r.t the output of the layer
        self.gradients = grad_output[0]
        
    def generate_cam(self, input_tensor, target_class):
        self.model.zero_grad()
        
        # Forward pass
        output = self.model(input_tensor)
        
        # Target for backprop
        target = output[0, target_class]
        target.backward(retain_graph=True)
        
        # Swin-T features have shape [batch, 7, 7, 768] at the final norm layer
        gradients = self.gradients[0] # [7, 7, 768]
        activations = self.activations[0] # [7, 7, 768]
        
        # Global average pooling on the gradients over the spatial dimensions (dim=0, 1)
        weights = torch.mean(gradients, dim=(0, 1)) # [768]
        
        # Weighted combination of activations
        cam = torch.zeros((7, 7), dtype=torch.float32, device=activations.device) # [7, 7]
        for i, w in enumerate(weights):
            cam += w * activations[:, :, i]
            
        # Apply ReLU
        cam = torch.nn.functional.relu(cam)
        
        # Reshape to 7x7 grid
        cam = cam.cpu().detach().numpy()
        
        # Normalize between 0 and 1
        cam_min, cam_max = cam.min(), cam.max()
        if cam_max - cam_min > 1e-7:
            cam = (cam - cam_min) / (cam_max - cam_min)
        else:
            cam = np.zeros_like(cam)
            
        # Resize to 224x224
        cam = cv2.resize(cam, (224, 224))
        return cam
    
    @staticmethod
    def overlay_heatmap(img_numpy, cam):
        """
        img_numpy: [224, 224, 3] RGB image array normalized between 0 and 1
        cam: [224, 224] grayscale heatmap between 0 and 1
        """
        heatmap = cv2.applyColorMap(np.uint8(255 * cam), cv2.COLORMAP_JET)
        heatmap = np.float32(heatmap) / 255
        heatmap = heatmap[..., ::-1] # Convert BGR to RGB
        
        overlay = heatmap * 0.5 + img_numpy * 0.5
        overlay = overlay / np.max(overlay)
        return np.uint8(255 * overlay)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "swin_t_best.pth")
CLINICAL_MODEL_PATH = os.path.join(os.path.dirname(__file__), "brain_tumor_model.pkl")
CLASSES = ["Glioma Tumor", "Meningioma Tumor", "No Tumor", "Pituitary Tumor"]
swin_model = None
device = None
clinical_model = None

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)

def load_bundled_doctors():
    doctors_path = os.path.join(os.path.dirname(__file__), "doctors_data.json")
    if os.path.exists(doctors_path):
        try:
            with open(doctors_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading doctors_data.json: {e}", flush=True)
    return []

async def seed_doctors_if_empty(database):
    try:
        count = 0
        if hasattr(database.doctors, "count_documents"):
            count = await database.doctors.count_documents({})
        else:
            docs = await database.doctors.find({}).to_list(length=1)
            count = len(docs)
        if count == 0:
            bundled = load_bundled_doctors()
            if bundled:
                to_insert = [dict(doc) for doc in bundled]
                await database.doctors.insert_many(to_insert)
                print(f"[AUTO-SEED] Successfully seeded {len(to_insert)} doctors into database.", flush=True)
                return True
        else:
            print(f"[AUTO-SEED] Database already contains {count} doctors.", flush=True)
    except Exception as e:
        print(f"[AUTO-SEED] Warning auto-seeding doctors: {e}", flush=True)
    return False

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global swin_model, device, clinical_model
    print("Starting up...")
    await connect_to_mongo()
    db = get_database()
    if db is not None:
        await seed_doctors_if_empty(db)
    
    if HAS_TORCH:
        try:
            device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
            print(f"Using device: {device} for PyTorch Inference", flush=True)
            
            if os.path.exists(MODEL_PATH):
                # Initialize Swin Transformer architecture
                swin_model = models.swin_t(weights=None)
                swin_model.head = nn.Sequential(
                    nn.Dropout(p=0.5),
                    nn.Linear(swin_model.head.in_features, len(CLASSES))
                )
                
                # Load checkpoint
                ckpt = torch.load(MODEL_PATH, map_location=device)
                swin_model.load_state_dict(ckpt, strict=False)
                swin_model.to(device)
                swin_model.eval()
                print(f"Swin Transformer loaded successfully from {MODEL_PATH}", flush=True)
            else:
                print(f"WARNING: Model file {MODEL_PATH} not found.", flush=True)
        except Exception as e:
            print(f"ERROR loading model: {e}", flush=True)
            swin_model = None
    else:
        print("[INFO] PyTorch not available in this environment. Swin-T image inference skipped.", flush=True)
        
    if os.path.exists(CLINICAL_MODEL_PATH):
        try:
            clinical_model = joblib.load(CLINICAL_MODEL_PATH)
            print(f"Clinical Model loaded successfully from {CLINICAL_MODEL_PATH}")
        except Exception as e:
            print(f"ERROR loading clinical model: {e}")
    else:
        print(f"WARNING: Clinical Model file {CLINICAL_MODEL_PATH} not found.")
    
    yield
    
    # Shutdown
    print("Shutting down...")
    await close_mongo_connection()

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://neuromedpk.app",
        "https://www.neuromedpk.app",
        "http://localhost:5173",
        "http://localhost:5175",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5175",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app|https://.*\.app|http://localhost:.*|http://127\.0\.0\.1:.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AUTH DEPENDENCIES ---
async def get_current_user(token: Optional[str] = Depends(oauth2_scheme), authorization: Optional[str] = Header(None)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    auth_token = token
    if not auth_token and authorization:
        if authorization.lower().startswith("bearer "):
            auth_token = authorization[7:].strip()
        else:
            auth_token = authorization.strip()
            
    if not auth_token:
        raise credentials_exception

    payload = verify_clerk_token(auth_token)
    if not payload or not payload.get("sub"):
        raise credentials_exception

    db = get_database()
    try:
        user = await sync_clerk_user(payload, db)
        if not user:
            raise credentials_exception
        return user
    except Exception as e:
        print(f"Error resolving Clerk user: {e}")
        raise credentials_exception

async def get_optional_user(authorization: Optional[str] = None):
    if not authorization:
        return None
    token = authorization[7:].strip() if authorization.lower().startswith("bearer ") else authorization.strip()
    if not token:
        return None
    payload = verify_clerk_token(token)
    if not payload or not payload.get("sub"):
        return None
    db = get_database()
    try:
        return await sync_clerk_user(payload, db)
    except Exception:
        return None

# --- DEPRECATED AUTH ROUTES (MIGRATED TO CLERK) ---
@app.post("/register")
async def register():
    return JSONResponse(status_code=400, content={"error": "deprecated", "message": "Authentication is now managed by Clerk. Please use Clerk on the frontend."})

@app.post("/login")
async def login():
    return JSONResponse(status_code=400, content={"error": "deprecated", "message": "Authentication is now managed by Clerk. Please use Clerk on the frontend."})

@app.post("/google-login")
async def google_login():
    return JSONResponse(status_code=400, content={"error": "deprecated", "message": "Authentication is now managed by Clerk. Please use Clerk on the frontend."})

# --- DOCTOR ROUTES ---
def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat/2) * math.sin(dLat/2) + math.cos(math.radians(lat1)) \
        * math.cos(math.radians(lat2)) * math.sin(dLon/2) * math.sin(dLon/2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    return R * c

@app.get("/doctors/nearby")
async def get_nearby_doctors(city: str = None, lat: float = None, lng: float = None):
    db = get_database()
    query = {"$or": [{"is_verified": True}, {"is_verified": {"$exists": False}}]}
    if city:
        query["city"] = {"$regex": f"^{city}$", "$options": "i"}
        
    doctors = []
    if db is not None:
        try:
            cursor = db.doctors.find(query)
            doctors = await cursor.to_list(length=100)
        except Exception as e:
            print(f"Error querying doctors collection: {e}", flush=True)
            doctors = []
            
    # Resilient fallback: if database has 0 doctors, load from bundled doctors_data.json
    if not doctors:
        bundled = load_bundled_doctors()
        if bundled:
            if db is not None:
                asyncio.create_task(seed_doctors_if_empty(db))
            filtered_bundled = []
            for d in bundled:
                d_copy = dict(d)
                if "_id" not in d_copy:
                    d_copy["_id"] = str(uuid.uuid4())
                else:
                    d_copy["_id"] = str(d_copy["_id"])
                if city and d_copy.get("city", "").strip().lower() != city.strip().lower():
                    continue
                filtered_bundled.append(d_copy)
            doctors = filtered_bundled
    
    result = []
    for d in doctors:
        d["_id"] = str(d.get("_id", uuid.uuid4()))
        if lat is not None and lng is not None and "latitude" in d and "longitude" in d:
            dist = haversine(lat, lng, d["latitude"], d["longitude"])
            d["distance_km"] = round(dist, 1)
        result.append(d)
        
    if lat is not None and lng is not None:
        result.sort(key=lambda x: x.get("distance_km", 9999))
        
    return {"doctors": result}

@app.post("/doctors/seed")
async def seed_doctors_endpoint():
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    bundled = load_bundled_doctors()
    if not bundled:
        raise HTTPException(status_code=404, detail="doctors_data.json not found on server")
    try:
        await db.doctors.delete_many({})
        to_insert = [dict(doc) for doc in bundled]
        await db.doctors.insert_many(to_insert)
        return {"status": "success", "count": len(to_insert), "message": f"Successfully seeded {len(to_insert)} doctors into database"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class DoctorRegister(BaseModel):
    name: str
    specialty: str
    city: str
    pmdc_number: str
    latitude: float
    longitude: float
    fee: int

@app.post("/doctors/register")
async def register_doctor(doctor: DoctorRegister, current_user = Depends(get_current_user)):
    db = get_database()
    doc_dict = doctor.model_dump()
    doc_dict["is_verified"] = False
    doc_dict["user_id"] = str(current_user["_id"])
    doc_dict["registered_at"] = datetime.utcnow().isoformat()
    
    res = await db.doctors.insert_one(doc_dict)
    doc_dict["_id"] = str(res.inserted_id)
    return {"message": "Doctor profile created successfully. Awaiting admin PMDC verification.", "doctor": doc_dict}

@app.get("/doctors/pending")
async def get_pending_doctors(current_user = Depends(get_current_user)):
    """Fetch all doctor registration requests awaiting PMDC verification"""
    db = get_database()
    if db is None:
        return {"pending_doctors": [], "count": 0}
    try:
        cursor = db.doctors.find({"is_verified": False})
        pending = await cursor.to_list(length=100)
        for doc in pending:
            doc["_id"] = str(doc["_id"])
        return {"pending_doctors": pending, "count": len(pending)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/doctors/{doctor_id}/verify")
async def verify_doctor(doctor_id: str, current_user = Depends(get_current_user)):
    """Approve/verify a doctor so they appear in the live referral network"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    from bson import ObjectId
    try:
        query = {"_id": ObjectId(doctor_id)}
    except Exception:
        query = {"_id": doctor_id}
        
    result = await db.doctors.update_one(query, {"$set": {"is_verified": True}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Doctor registration not found")
    return {"message": "Doctor successfully verified! Now visible in referral network.", "doctor_id": doctor_id}

@app.delete("/doctors/{doctor_id}")
async def reject_doctor(doctor_id: str, current_user = Depends(get_current_user)):
    """Reject or delete a doctor profile"""
    db = get_database()
    if db is None:
        raise HTTPException(status_code=500, detail="Database not initialized")
    from bson import ObjectId
    try:
        query = {"_id": ObjectId(doctor_id)}
    except Exception:
        query = {"_id": doctor_id}
        
    result = await db.doctors.delete_one(query)
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return {"message": "Doctor registration removed successfully", "doctor_id": doctor_id}

@app.get("/me", response_model=UserOut)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return UserOut(
        id=str(current_user["_id"]),
        fullName=current_user["fullName"],
        email=current_user["email"],
        avatar=current_user.get("avatar")
    )

@app.put("/me", response_model=UserOut)
async def update_users_me(user_update: UserUpdate, current_user: dict = Depends(get_current_user)):
    db = get_database()
    update_data = {}
    
    if user_update.fullName is not None:
        update_data["fullName"] = user_update.fullName
        
    if user_update.email is not None and user_update.email != current_user["email"]:
        existing = await db.users.find_one({"email": user_update.email})
        if existing:
            raise HTTPException(status_code=400, detail="Email already registered")
        update_data["email"] = user_update.email
        
    # Password management is handled by Clerk
        
    if user_update.avatar is not None:
        update_data["avatar"] = user_update.avatar
        
    if update_data:
        await db.users.update_one({"_id": current_user["_id"]}, {"$set": update_data})
        
    # fetch updated user
    updated_user = await db.users.find_one({"_id": current_user["_id"]})
    return UserOut(
        id=str(updated_user["_id"]),
        fullName=updated_user["fullName"],
        email=updated_user["email"],
        avatar=updated_user.get("avatar")
    )

# --- SETTINGS ROUTES ---
@app.get("/settings")
async def get_settings(current_user: dict = Depends(get_current_user)):
    return current_user.get("settings", {})

@app.post("/settings")
async def update_settings(settings: UserSettings, current_user: dict = Depends(get_current_user)):
    db = get_database()
    update_data = {}
    if settings.saveHistory is not None:
        update_data["settings.saveHistory"] = settings.saveHistory
    if settings.emailNotifications is not None:
        update_data["settings.emailNotifications"] = settings.emailNotifications
    if settings.timezone is not None:
        update_data["settings.timezone"] = settings.timezone
        
    if update_data:
        await db.users.update_one({"_id": current_user["_id"]}, {"$set": update_data})
    return {"message": "Settings updated successfully"}

# --- HISTORY ROUTES ---
@app.get("/history", response_model=List[HistoryItem])
async def get_history(current_user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.history.find({"user_id": str(current_user["_id"])}).sort("timestamp", -1)
    history_items = await cursor.to_list(length=100)
    
    return [
        {
            "id": str(item["_id"]),
            "type": item.get("type", "mri"),
            "filename": item.get("filename", None),
            "patient_name": item.get("patient_name", "Unknown Patient"),
            "prediction": item.get("prediction", "Unknown"),
            "confidence": item.get("confidence", 0),
            "symptoms": item.get("symptoms", None),
            "explanation": item.get("explanation", None),
            "warning": item.get("warning", None),
            "timestamp": item["timestamp"].isoformat() if hasattr(item["timestamp"], "isoformat") else str(item["timestamp"])
        } for item in history_items
    ]

@app.delete("/history/{history_id}")
async def delete_history_item(history_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    try:
        result = await db.history.delete_one({"_id": ObjectId(history_id), "user_id": str(current_user["_id"])})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="History item not found")
        return {"message": "History item deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid ID format")

@app.delete("/history")
async def clear_history(current_user: dict = Depends(get_current_user)):
    db = get_database()
    result = await db.history.delete_many({"user_id": str(current_user["_id"])})
    return {"message": f"Deleted {result.deleted_count} items"}

# --- PREDICTION ROUTE ---
def preprocess_image(image_bytes):
    if not HAS_TORCH or transforms is None:
        return None
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    
    preprocess = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    input_tensor = preprocess(img)
    input_batch = input_tensor.unsqueeze(0)
    return input_batch

@app.post("/predict")
async def predict(file: UploadFile = File(...), authorization: Optional[str] = Header(None), patient_name: Optional[str] = Form(None)):
    global swin_model, device
    print(f"[DEBUG] /predict called | patient_name={repr(patient_name)} | file={file.filename}")
    
    if swin_model is None or not HAS_TORCH:
        return JSONResponse(status_code=503, content={"error": "Vision model not loaded or PyTorch unavailable."})

    try:
        contents = await file.read()

        # ====== IMAGE VALIDITY PRE-CHECK ======
        try:
            img_check = Image.open(io.BytesIO(contents)).convert('RGB')
        except Exception:
            return JSONResponse(status_code=422, content={
                "error": "invalid_mri",
                "message": "File could not be read as an image. Please upload a valid image file (JPG/PNG)."
            })

        img_rgb = np.array(img_check).astype(np.float32)
        r, g, b = img_rgb[:,:,0], img_rgb[:,:,1], img_rgb[:,:,2]

        # 1. Color saturation check — real MRI scans are grayscale (very low saturation)
        max_c = np.maximum(np.maximum(r, g), b)
        min_c = np.minimum(np.minimum(r, g), b)
        saturation = np.where(max_c > 0, (max_c - min_c) / max_c, 0)
        avg_saturation = float(saturation.mean())

        # 2. RGB channel imbalance — real MRI: R≈G≈B (grayscale)
        #    Colored images have large differences between channels
        r_mean = float(r.mean())
        g_mean = float(g.mean())
        b_mean = float(b.mean())
        channel_spread = float(np.std([r_mean, g_mean, b_mean]))

        # Reject if image is colorful OR if channels are very imbalanced
        if avg_saturation > 0.10 or channel_spread > 15:
            return JSONResponse(status_code=422, content={
                "error": "invalid_mri",
                "message": "Invalid MRI Image: The uploaded image appears to be a colored or artistic image, not a real brain MRI scan. Real MRI scans are grayscale. Please upload an actual clinical brain MRI image."
            })

        # 2. Brightness sanity check — completely black or white images rejected
        gray_mean = float((0.299 * r + 0.587 * g + 0.114 * b).mean())
        if gray_mean < 5 or gray_mean > 250:
            return JSONResponse(status_code=422, content={
                "error": "invalid_mri",
                "message": "Invalid MRI Image: The image appears to be blank or corrupted. Please upload a valid brain MRI scan."
            })
        # ====== END PRE-CHECK ======

        input_data = preprocess_image(contents).to(device)
        
        # --- Confidence Calibration (Temperature Scaling) ---
        # A temperature > 1.0 softens the extreme 99.9% confidence to a more realistic clinical range (e.g., 80-85%)
        CALIBRATION_TEMPERATURE = 2.5
        
        with torch.no_grad():
            outputs = swin_model(input_data)
            # Divide logits by temperature BEFORE softmax
            scaled_logits = outputs[0] / CALIBRATION_TEMPERATURE
            probabilities_tensor = torch.nn.functional.softmax(scaled_logits, dim=0)
            probabilities = probabilities_tensor.cpu().numpy()
        
        predicted_class_idx = int(np.argmax(probabilities))
        confidence = float(probabilities[predicted_class_idx])

        # --- XAI Heatmap Generation ---
        heatmap_base64 = None
        pure_heatmap_base64 = None
        try:
            cam_generator = NativeSwinGradCAM(swin_model, swin_model.features[-1][-1].norm2)
            cam_mask = cam_generator.generate_cam(input_data, predicted_class_idx)
            cam_generator.remove_hooks()
            
            # Prepare original image for overlay
            img_rgb_norm = img_rgb / 255.0
            img_rgb_norm = cv2.resize(img_rgb_norm, (224, 224))
            
            overlay = NativeSwinGradCAM.overlay_heatmap(img_rgb_norm, cam_mask)
            
            # Convert overlay to base64
            is_success, buffer = cv2.imencode(".jpg", overlay[..., ::-1]) # Convert RGB back to BGR for cv2 encode
            if is_success:
                io_buf = io.BytesIO(buffer)
                heatmap_base64 = base64.b64encode(io_buf.getvalue()).decode('utf-8')
                
            # Generate pure heatmap (without MRI background)
            pure_heatmap = cv2.applyColorMap(np.uint8(255 * cam_mask), cv2.COLORMAP_JET)
            is_success, buffer = cv2.imencode(".jpg", pure_heatmap)
            if is_success:
                io_buf = io.BytesIO(buffer)
                pure_heatmap_base64 = base64.b64encode(io_buf.getvalue()).decode('utf-8')
        except Exception as e:
            print(f"Error generating Grad-CAM: {e}")
            if 'cam_generator' in locals():
                cam_generator.remove_hooks()
        # ------------------------------

        # --- Image Validity Check ---
        # If the top confidence is very low (<35%), the model cannot reliably classify this image.
        # This typically means the image is NOT a valid brain MRI.
        INVALID_THRESHOLD = 0.35
        LOW_CONFIDENCE_THRESHOLD = 0.55

        if confidence < INVALID_THRESHOLD:
            return JSONResponse(status_code=422, content={
                "error": "invalid_mri",
                "message": "This does not appear to be a valid Brain MRI image. Please upload a proper grayscale brain MRI scan for accurate diagnosis."
            })

        # Determine warning level
        warning = None
        if confidence < LOW_CONFIDENCE_THRESHOLD:
            warning = "Low confidence result. AI could not analyze this scan with certainty. Please consult a qualified medical professional for a proper clinical diagnosis."

        result_data = {
            "prediction": CLASSES[predicted_class_idx] if predicted_class_idx < len(CLASSES) else "Unknown",
            "confidence": confidence,
            "filename": file.filename,
            "patient_name": patient_name.strip() if patient_name and patient_name.strip() else "Unknown Patient",
            "warning": warning,
            "heatmap_base64": heatmap_base64,
            "pure_heatmap_base64": pure_heatmap_base64
        }
        
        # If token is provided in header, try to save to history
        if authorization:
            user = await get_optional_user(authorization)
            if user:
                settings = user.get("settings", {})
                if settings.get("saveHistory", True):
                    try:
                        db = get_database()
                        await db.history.insert_one({
                            "user_id": str(user["_id"]),
                            "filename": file.filename,
                            "patient_name": result_data["patient_name"],
                            "prediction": result_data["prediction"],
                            "confidence": result_data["confidence"],
                            "timestamp": datetime.now(timezone.utc)
                        })
                    except Exception as e:
                        print("Failed to save history:", str(e))
        
        return result_data
    
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/analyze/clinical", response_model=ClinicalResponse)
async def analyze_clinical(
    request: ClinicalRequest, 
    authorization: Optional[str] = Header(None)
):
    if clinical_model is None:
        raise HTTPException(status_code=503, detail="Clinical model not loaded")
        
    try:
        # Expected feature order exactly as trained
        expected_features = [
            "Headache_Persistent", "Nausea_Vomiting", "Vision_Changes",
            "Seizures", "Balance_Coordination_Issues", "Speech_Difficulties",
            "Memory_Loss", "Weakness_Numbness", "Personality_Changes",
            "Fatigue", "Sensitivity_Light", "Sleep_Disturbances"
        ]
        
        # Build input array
        input_data = []
        for feature in expected_features:
            val = request.symptoms.get(feature, 0)
            input_data.append(int(val))
            
        X = np.array([input_data])
        
        # Predict using probabilities
        probs = clinical_model.predict_proba(X)[0]
        confidence = float(probs[1]) # probability of class 1 (High risk)
        
        # Decision threshold from model_info.json is ~0.40889
        risk_level = "High symptom-based risk" if confidence >= 0.40889 else "Low symptom-based risk"
        recommendation = "Immediate Follow-up Required" if risk_level == "High symptom-based risk" else "Monitor Symptoms"
        
        # Feature Importance (XAI)
        important_features = []
        if hasattr(clinical_model, 'coef_'):
            coefs = clinical_model.coef_[0]
            contributions = {}
            for idx, feature in enumerate(expected_features):
                if input_data[idx] > 0:
                    contributions[feature] = float(coefs[idx])
            important_features = [k for k, v in sorted(contributions.items(), key=lambda item: item[1], reverse=True)]

        result_data = {
            "risk_level": risk_level,
            "confidence": confidence,
            "recommendation": recommendation,
            "important_features": important_features,
            "id": ""
        }
        
        # Save history if authenticated
        if authorization:
            user = await get_optional_user(authorization)
            if user:
                settings = user.get("settings", {})
                if settings.get("saveHistory", True):
                    try:
                        db = get_database()
                        history_item = {
                            "user_id": str(user["_id"]),
                            "type": "clinical",
                            "patient_name": request.patientName or "Unknown Patient",
                            "symptoms": [f for f, v in request.symptoms.items() if v],
                            "prediction": risk_level,
                            "confidence": confidence,
                            "timestamp": datetime.now(timezone.utc)
                        }
                        res = await db.history.insert_one(history_item)
                        result_data["id"] = str(res.inserted_id)
                    except Exception as e:
                        print("Failed to save clinical history:", str(e))
                
        return result_data
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})


@app.post("/api/analyze/fusion")
async def analyze_fusion(
    file: UploadFile = File(...),
    symptoms: str = Form(...), # JSON string of symptoms dict
    patient_name: Optional[str] = Form(None),
    authorization: Optional[str] = Header(None)
):
    global swin_model, device, clinical_model
    if swin_model is None or clinical_model is None:
        return JSONResponse(status_code=503, content={"error": "Models not fully loaded."})

    try:
        # 1. PROCESS MRI IMAGE
        contents = await file.read()
        
        analysis_id = f"NM-{uuid.uuid4().hex[:8].upper()}"
        file_ext = file.filename.split('.')[-1]
        save_path = os.path.join('uploads', f"{analysis_id}.{file_ext}")
        os.makedirs('uploads', exist_ok=True)
        with open(save_path, "wb") as f:
            f.write(contents)

        # 0. Agentic Image Validation
        is_valid, validation_error = validate_mri(save_path)
        if not is_valid:
            os.remove(save_path)
            return JSONResponse(status_code=400, content={"error": f"Image rejected: {validation_error}"})
            
        try:
            img_check = Image.open(io.BytesIO(contents)).convert('RGB')
        except Exception:
            return JSONResponse(status_code=422, content={"error": "invalid_mri", "message": "Invalid image file."})
            
        img_rgb = np.array(img_check).astype(np.float32)
            
        input_data = preprocess_image(contents).to(device)
        CALIBRATION_TEMPERATURE = 2.5
        
        with torch.no_grad():
            outputs = swin_model(input_data)
            scaled_logits = outputs[0] / CALIBRATION_TEMPERATURE
            probabilities_tensor = torch.nn.functional.softmax(scaled_logits, dim=0)
            mri_probabilities = probabilities_tensor.cpu().numpy()
            
        mri_class_idx = int(np.argmax(mri_probabilities))
        mri_confidence = float(mri_probabilities[mri_class_idx])
        mri_prediction = CLASSES[mri_class_idx] if mri_class_idx < len(CLASSES) else "Unknown"
        mri_probs_dict = {CLASSES[i]: float(mri_probabilities[i]) for i in range(len(CLASSES))}

        # Generate Heatmap for MRI
        heatmap_base64 = None
        overlay_path = ""
        try:
            cam_generator = NativeSwinGradCAM(swin_model, swin_model.features[-1][-1].norm2)
            cam_mask = cam_generator.generate_cam(input_data, mri_class_idx)
            cam_generator.remove_hooks()
            img_rgb_norm = cv2.resize(img_rgb / 255.0, (224, 224))
            overlay = NativeSwinGradCAM.overlay_heatmap(img_rgb_norm, cam_mask)
            is_success, buffer = cv2.imencode(".jpg", overlay[..., ::-1])
            if is_success:
                io_buf = io.BytesIO(buffer)
                heatmap_base64 = base64.b64encode(io_buf.getvalue()).decode('utf-8')
                overlay_path = os.path.join('uploads', f"{analysis_id}_overlay.jpg")
                with open(overlay_path, "wb") as f:
                    f.write(io_buf.getvalue())
        except Exception as e:
            if 'cam_generator' in locals():
                cam_generator.remove_hooks()
                
        # 2. PROCESS CLINICAL SYMPTOMS
        try:
            symptoms_dict = json.loads(symptoms)
        except json.JSONDecodeError:
            symptoms_dict = {}
            
        expected_features = [
            "Headache_Persistent", "Nausea_Vomiting", "Vision_Changes",
            "Seizures", "Balance_Coordination_Issues", "Speech_Difficulties",
            "Memory_Loss", "Weakness_Numbness", "Personality_Changes",
            "Fatigue", "Sensitivity_Light", "Sleep_Disturbances"
        ]
        
        clin_input = [int(symptoms_dict.get(f, 0)) for f in expected_features]
        clin_X = np.array([clin_input])
        clin_probs = clinical_model.predict_proba(clin_X)[0]
        clin_risk_prob = float(clin_probs[1])
        
        important_features = []
        if hasattr(clinical_model, 'coef_'):
            coefs = clinical_model.coef_[0]
            contributions = {f: float(coefs[i]) for i, f in enumerate(expected_features) if clin_input[i] > 0}
            important_features = [k for k, v in sorted(contributions.items(), key=lambda item: item[1], reverse=True)]

        # 3. MULTIMODAL LATE FUSION (MLT)
        W_MRI = 0.60
        W_CLIN = 0.40
        
        mri_tumor_prob = 1.0 - float(mri_probabilities[CLASSES.index("No Tumor")]) if "No Tumor" in CLASSES else float(1.0 - mri_probabilities[2])
        fused_tumor_prob = (W_MRI * mri_tumor_prob) + (W_CLIN * clin_risk_prob)
        
        if fused_tumor_prob >= 0.5:
            if mri_prediction != "No Tumor":
                fused_prediction = mri_prediction
                fused_confidence = (W_MRI * mri_confidence) + (W_CLIN * clin_risk_prob)
            else:
                fused_prediction = "High symptom-based risk"
                fused_confidence = fused_tumor_prob
        else:
            fused_prediction = "No Tumor Detected"
            fused_confidence = 1.0 - fused_tumor_prob
            
        warning = None
        if fused_confidence < 0.60:
            warning = "High Uncertainty Detected. The multimodal models have conflicting predictions or low confidence. Please consult a human specialist immediately."
            
        explanation = ""
        try:
            # Generate AI Explanation
            explanation = generate_explanation({
                "predicted_class": fused_prediction,
                "confidence": fused_confidence,
                "probabilities": mri_probs_dict
            })
        except Exception as e:
            explanation = f"AI Explanation generation failed: {str(e)}"
            
        result_data = {
            "id": analysis_id,
            "prediction": fused_prediction,
            "confidence": fused_confidence,
            "patient_name": patient_name.strip() if patient_name and patient_name.strip() else "Unknown Patient",
            "warning": warning,
            "heatmap_base64": heatmap_base64,
            "image_path": save_path,
            "overlay_path": overlay_path,
            "explanation": explanation,
            "important_features": important_features,
            "mri_prediction": mri_prediction,
            "probabilities": mri_probs_dict,
            "clinical_risk": "High" if clin_risk_prob >= 0.40889 else "Low"
        }
        
        if authorization:
            user = await get_optional_user(authorization)
            if user and user.get("settings", {}).get("saveHistory", True):
                try:
                    db = get_database()
                    await db.history.insert_one({
                        "user_id": str(user["_id"]),
                        "analysis_id": analysis_id,
                        "type": "fusion",
                        "patient_name": result_data["patient_name"],
                        "prediction": result_data["prediction"],
                        "confidence": result_data["confidence"],
                        "explanation": explanation,
                        "probabilities": mri_probs_dict,
                        "image_path": save_path,
                        "overlay_path": overlay_path,
                        "timestamp": datetime.now(timezone.utc)
                    })
                except Exception as e:
                    print("Failed to save fusion history:", str(e))
                
        return result_data
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})



class ChatRequest(BaseModel):
    analysis_id: str
    message: str

@app.post("/api/v1/analyze")
async def neuromed_analyze_mri(file: UploadFile = File(...), authorization: Optional[str] = Header(None), patient_name: Optional[str] = Form(None)):
    global swin_model, device
    if swin_model is None:
        return JSONResponse(status_code=503, content={"error": "Model not loaded."})

    try:
        contents = await file.read()
        
        analysis_id = f"NM-{uuid.uuid4().hex[:8].upper()}"
        file_ext = file.filename.split('.')[-1]
        save_path = os.path.join('uploads', f"{analysis_id}.{file_ext}")
        os.makedirs('uploads', exist_ok=True)
        
        with open(save_path, "wb") as f:
            f.write(contents)

        # 0. Agentic Image Validation (Check if it's an MRI)
        is_valid, validation_error = validate_mri(save_path)
        if not is_valid:
            os.remove(save_path)
            return JSONResponse(status_code=400, content={"error": f"Image rejected: {validation_error}"})

        # 1. AI Analysis & Grad-CAM
        input_data = preprocess_image(contents).to(device)
        CALIBRATION_TEMPERATURE = 2.5
        
        with torch.no_grad():
            outputs = swin_model(input_data)
            scaled_logits = outputs[0] / CALIBRATION_TEMPERATURE
            probabilities_tensor = torch.nn.functional.softmax(scaled_logits, dim=0)
            probabilities = probabilities_tensor.cpu().numpy()
            
        predicted_class_idx = int(np.argmax(probabilities))
        confidence = float(probabilities[predicted_class_idx])
        predicted_class = CLASSES[predicted_class_idx] if predicted_class_idx < len(CLASSES) else "Unknown"
        
        probs_dict = {CLASSES[i]: float(probabilities[i]) for i in range(len(CLASSES))}
        
        heatmap_base64 = None
        overlay_path = ""
        try:
            cam_generator = NativeSwinGradCAM(swin_model, swin_model.features[-1][-1].norm2)
            cam_mask = cam_generator.generate_cam(input_data, predicted_class_idx)
            cam_generator.remove_hooks()
            
            img_check = Image.open(io.BytesIO(contents)).convert('RGB')
            img_rgb = np.array(img_check).astype(np.float32)
            img_rgb_norm = img_rgb / 255.0
            img_rgb_norm = cv2.resize(img_rgb_norm, (224, 224))
            
            overlay = NativeSwinGradCAM.overlay_heatmap(img_rgb_norm, cam_mask)
            is_success, buffer = cv2.imencode(".jpg", overlay[..., ::-1])
            if is_success:
                io_buf = io.BytesIO(buffer)
                heatmap_base64 = base64.b64encode(io_buf.getvalue()).decode('utf-8')
                
                overlay_path = os.path.join('uploads', f"{analysis_id}_overlay.jpg")
                with open(overlay_path, "wb") as f:
                    f.write(io_buf.getvalue())
        except Exception as e:
            if 'cam_generator' in locals():
                cam_generator.remove_hooks()

        # 2. GenAI Explanation
        explanation = ""
        try:
            explanation = generate_explanation({
                "predicted_class": predicted_class,
                "confidence": confidence,
                "probabilities": probs_dict
            })
        except Exception as e:
            explanation = f"AI Explanation generation failed: {str(e)}"

        # 3. Save to DB
        result_data = {
            "id": analysis_id,
            "patient_name": patient_name.strip() if patient_name and patient_name.strip() else "Unknown Patient",
            "prediction": predicted_class,
            "confidence": confidence,
            "probabilities": probs_dict,
            "heatmap_base64": heatmap_base64,
            "image_path": save_path,
            "overlay_path": overlay_path,
            "explanation": explanation,
            "timestamp": datetime.now(timezone.utc)
        }
        
        if authorization:
            user = await get_optional_user(authorization)
            if user:
                try:
                    db = get_database()
                    await db.history.insert_one({
                        "user_id": str(user["_id"]),
                        "analysis_id": analysis_id,
                        "type": "mri",
                        "patient_name": result_data["patient_name"],
                        "filename": file.filename,
                        "prediction": predicted_class,
                        "confidence": confidence,
                        "explanation": explanation,
                        "probabilities": probs_dict,
                        "image_path": save_path,
                        "overlay_path": overlay_path,
                        "timestamp": datetime.now(timezone.utc)
                    })
                except Exception as e:
                    print("Failed to save MRI history:", str(e))

        return result_data
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/api/v1/reports")
async def create_report(request_data: dict, authorization: Optional[str] = Header(None)):
    analysis_id = request_data.get("analysis_id")
    if not analysis_id:
        return JSONResponse(status_code=400, content={"error": "analysis_id is required"})

    db = get_database()
    analysis = await db.history.find_one({"analysis_id": analysis_id})
    
    if not analysis:
        # Fallback if unauthenticated but they just analyzed
        return JSONResponse(status_code=404, content={"error": "Analysis not found in history, cannot generate report"})

    report_filename = f"{analysis_id}_report.pdf"
    report_path = os.path.join('uploads', report_filename)
    
    analysis_data = {
        "id": analysis_id,
        "prediction": analysis["prediction"],
        "confidence": analysis["confidence"],
        "probabilities": analysis["probabilities"],
        "image_path": analysis.get("image_path", ""),
        "overlay_path": analysis.get("overlay_path", ""),
        "explanation": analysis["explanation"]
    }
    
    try:
        generate_pdf_report(analysis_data, report_path)
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": f"Report generation failed: {str(e)}"})

    return {"status": "success", "file_url": f"/api/v1/reports/download/{report_filename}"}

@app.get("/api/v1/reports/download/{filename}")
async def download_report(filename: str):
    file_path = os.path.join('uploads', filename)
    if not os.path.exists(file_path):
        return JSONResponse(status_code=404, content={"error": "Report not found"})
    return FileResponse(file_path, media_type="application/pdf", filename=filename)

@app.post("/api/v1/ai/chat")
async def ai_chat_endpoint(request: ChatRequest, authorization: Optional[str] = Header(None)):
    db = get_database()
    analysis = await db.history.find_one({"analysis_id": request.analysis_id})
    if not analysis:
        return JSONResponse(status_code=404, content={"error": "Analysis not found"})

    context = {
        "prediction": analysis["prediction"],
        "confidence": analysis["confidence"],
        "explanation": analysis["explanation"]
    }
    
    try:
        response = chat_with_assistant(context, request.message)
        return {"response": response}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
