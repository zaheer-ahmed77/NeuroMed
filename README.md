# NeuroMed - AI-Powered Brain Tumor Diagnostic Platform

NeuroMed is a professional medical diagnostic web application designed to analyze brain MRI scans using AI. It provides clinicians and patients with fast, reliable tumor detection and classification.

## 🚀 Features
- **MRI Analysis:** Upload grayscale brain MRI scans for instant tumor detection.
- **Classification:** Identifies Glioma, Meningioma, Pituitary tumors, or "No Tumor".
- **History Tracking:** Securely save and manage previous analyses with individual and bulk delete options.
- **Modern UI:** Glassmorphism-inspired dark mode aesthetic for a premium experience.
- **Interactive Reports:** Generate downloadable PDF reports of the diagnostic results.

## 🛠️ Tech Stack
- **Frontend:** React, Vite, Lucide-react, TailwindCSS
- **Backend:** FastAPI (Python), ONNX Runtime (AI Inference)
- **Database:** MongoDB (Asynchronous with Motor)
- **Authentication:** JWT (JSON Web Tokens) with Google OAuth support

## 💻 Local Setup

### 1. Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- MongoDB (Running locally or on Atlas)

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### 3. Frontend Setup
```bash
# In the root directory
npm install
npm run dev
```

## 🌐 Deployment Guide

To deploy this project as a **fully running application**, follow these steps:

### 1. Database (MongoDB Atlas)
- Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
- Get your connection string and update it in `backend/.env` under `MONGODB_URI`.

### 2. Backend (Render / Railway)
- **Render:** Connect your GitHub repo, set the environment to `Python`, and use the start command `uvicorn main:app --host 0.0.0.0 --port $PORT`.
- **Environment Variables:** Add `MONGODB_URI`, `SECRET_KEY`, and `ALGORITHM` in the dashboard.

### 3. Frontend (Vercel / Netlify)
- Connect your GitHub repo.
- **Build Settings:** 
  - Build Command: `npm run build`
  - Output Directory: `dist`
- **API Config:** Update `src/config.js` with your deployed backend URL.

## 📄 License
This project is for educational purposes (Final Year Project).
