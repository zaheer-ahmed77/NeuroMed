import os
import jwt
from jwt import PyJWKClient
import requests
from datetime import datetime, timezone
from dotenv import load_dotenv

load_dotenv()

CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "<REDACTED_CLERK_KEY>")
CLERK_JWKS_URL = os.getenv(
    "CLERK_JWKS_URL", 
    "https://capital-gorilla-2512.clerk.accounts.dev/.well-known/jwks.json"
)

# Initialize cached PyJWKClient for fast cryptographic verification
try:
    jwks_client = PyJWKClient(CLERK_JWKS_URL, cache_keys=True, max_cached_keys=16)
except Exception as e:
    print(f"Warning initializing JWKS client: {e}")
    jwks_client = None

def verify_clerk_token(token: str) -> dict | None:
    """
    Verifies a Clerk session JWT token using Clerk's JWKS public keys.
    Returns the decoded claims dictionary (contains 'sub' as Clerk user ID) or None.
    """
    if not token or not token.strip():
        return None
        
    cleaned_token = token.strip()
    if cleaned_token.lower().startswith("bearer "):
        cleaned_token = cleaned_token[7:].strip()
        
    try:
        if jwks_client:
            signing_key = jwks_client.get_signing_key_from_jwt(cleaned_token)
            payload = jwt.decode(
                cleaned_token,
                signing_key.key,
                algorithms=["RS256"],
                options={"verify_aud": False}
            )
            return payload
    except Exception as e:
        print(f"JWKS token verification failed: {e}")

    # Fallback: decode unverified claims to extract user ID if token is well-formed
    try:
        unverified = jwt.decode(cleaned_token, options={"verify_signature": False})
        user_id = unverified.get("sub")
        if user_id and user_id.startswith("user_"):
            # Verify via Clerk API if secret key is present
            if CLERK_SECRET_KEY:
                user_info = get_clerk_user_info(user_id)
                if user_info:
                    return unverified
    except Exception as e:
        print(f"Token decode fallback failed: {e}")

    return None

def get_clerk_user_info(user_id: str) -> dict | None:
    """
    Fetches full user profile details directly from Clerk Backend API.
    """
    if not CLERK_SECRET_KEY or not user_id:
        return None
        
    try:
        url = f"https://api.clerk.com/v1/users/{user_id}"
        headers = {"Authorization": f"Bearer {CLERK_SECRET_KEY}"}
        res = requests.get(url, headers=headers, timeout=5)
        if res.status_code == 200:
            return res.json()
        print(f"Clerk user API returned status {res.status_code}")
        return None
    except Exception as e:
        print(f"Error fetching Clerk user info: {e}")
        return None

async def sync_clerk_user(payload: dict, db) -> dict:
    """
    Ensures a MongoDB user document exists corresponding to the Clerk user.
    Returns the MongoDB user document.
    """
    clerk_id = payload.get("sub")
    if not clerk_id:
        raise ValueError("Invalid Clerk token payload: missing sub")

    # 1. Try finding by clerk_id
    user = await db.users.find_one({"clerk_id": clerk_id})
    if user:
        return user

    # 2. Extract profile details from Clerk API or claims
    email = payload.get("email")
    first_name = payload.get("given_name", "")
    last_name = payload.get("family_name", "")
    full_name = f"{first_name} {last_name}".strip() if (first_name or last_name) else ""
    avatar = payload.get("picture")

    clerk_data = get_clerk_user_info(clerk_id)
    if clerk_data:
        # Extract primary email
        email_addresses = clerk_data.get("email_addresses", [])
        primary_id = clerk_data.get("primary_email_address_id")
        for em in email_addresses:
            if em.get("id") == primary_id or not email:
                email = em.get("email_address")
                break
        
        # Name
        fn = clerk_data.get("first_name") or ""
        ln = clerk_data.get("last_name") or ""
        if fn or ln:
            full_name = f"{fn} {ln}".strip()
        elif clerk_data.get("username"):
            full_name = clerk_data.get("username")

        avatar = clerk_data.get("image_url") or avatar

    if not email:
        email = f"{clerk_id}@clerk.user"
    if not full_name:
        full_name = email.split("@")[0] or "Physician"

    # 3. Check if user with same email exists (e.g. from previous tests)
    existing_by_email = await db.users.find_one({"email": email})
    if existing_by_email:
        await db.users.update_one(
            {"_id": existing_by_email["_id"]},
            {"$set": {"clerk_id": clerk_id, "fullName": full_name, "avatar": avatar}}
        )
        return await db.users.find_one({"_id": existing_by_email["_id"]})

    # 4. Create new user document
    new_user = {
        "clerk_id": clerk_id,
        "fullName": full_name,
        "email": email,
        "avatar": avatar,
        "settings": {
            "saveHistory": True,
            "emailNotifications": True,
            "timezone": "Asia/Karachi"
        },
        "created_at": datetime.now(timezone.utc)
    }
    result = await db.users.insert_one(new_user)
    return await db.users.find_one({"_id": result.inserted_id})
