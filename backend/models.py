from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class UserCreate(BaseModel):
    fullName: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class GoogleLoginRequest(BaseModel):
    token: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserOut(BaseModel):
    id: str
    fullName: str
    email: str
    avatar: Optional[str] = None

class UserUpdate(BaseModel):
    fullName: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    avatar: Optional[str] = None

class UserSettings(BaseModel):
    saveHistory: Optional[bool] = None
    emailNotifications: Optional[bool] = None
    timezone: Optional[str] = None

class HistoryItem(BaseModel):
    id: str
    type: str = "mri" # "mri" or "clinical"
    filename: Optional[str] = None
    patient_name: Optional[str] = "Unknown Patient"
    prediction: str
    confidence: float
    symptoms: Optional[List[str]] = None
    timestamp: datetime

class ClinicalRequest(BaseModel):
    symptoms: dict[str, int]
    patientName: Optional[str] = None
    patientAge: Optional[str] = None

class ClinicalResponse(BaseModel):
    risk_level: str
    confidence: float
    recommendation: Optional[str] = None
    important_features: Optional[List[str]] = None
    id: str # history id
