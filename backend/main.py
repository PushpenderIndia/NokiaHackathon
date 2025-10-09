import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from urllib.parse import quote_plus

# Load environment variables
load_dotenv()

# Get MongoDB credentials
username = os.getenv("MONGO_USERNAME")
password = os.getenv("MONGO_PASSWORD")
cluster = os.getenv("MONGO_CLUSTER")
DB_NAME = os.getenv("MONGO_DB_NAME", "mydatabase")

if not all([username, password, cluster]):
    raise RuntimeError("Please set MONGO_USERNAME, MONGO_PASSWORD, and MONGO_CLUSTER in .env file")

# Create properly encoded MongoDB URI
MONGODB_URI = f"mongodb+srv://{quote_plus(username)}:{quote_plus(password)}@{cluster}/?retryWrites=true&w=majority"

# Create properly encoded MongoDB URI
MONGODB_URI = f"mongodb+srv://{quote_plus(username)}:{quote_plus(password)}@{cluster}/?retryWrites=true&w=majority"

# Connect to MongoDB
client = AsyncIOMotorClient(MONGODB_URI)
db = client[DB_NAME]

# Initialize FastAPI
app = FastAPI(title="RakshakAI Multi-Collection API")

# ----------------------------------------
# MODELS
# ----------------------------------------

class Driver(BaseModel):
    name: str
    status: str
    latitude: float
    longitude: float

class PatientLocation(BaseModel):
    location: str
    latitude: float
    longitude: float

class Emergency(BaseModel):
    call_id: str
    status: str
    driver: Driver
    patient: PatientLocation

class PatientInfo(BaseModel):
    name: str
    date: str
    duration: str

class MedicalRecord(BaseModel):
    call_id: str
    patient_information: PatientInfo
    chief_complaint: str
    reported_symptoms: List[str]
    ai_analysis: str
    recommended_specialty: str

# ----------------------------------------
# ROUTES
# ----------------------------------------

@app.post("/emergency_detected")
async def create_emergency_record(payload: Emergency):
    collection = db["emergency"]
    await collection.insert_one(payload.dict())
    return {"message": "Emergency record stored successfully", "data": payload.dict()}


@app.post("/medical_record")
async def create_medical_record(payload: MedicalRecord):
    collection = db["medical_record"]
    await collection.insert_one(payload.dict())
    return {"message": "Medical record stored successfully", "data": payload.dict()}


@app.get("/status")
async def get_status(call_id: str = Query(..., description="Unique call ID")):
    emergency_col = db["emergency"]
    medical_col = db["medical_record"]

    emergency_data = await emergency_col.find_one({"call_id": call_id})
    medical_data = await medical_col.find_one({"call_id": call_id})

    if not emergency_data and not medical_data:
        raise HTTPException(status_code=404, detail="No records found for this call_id")

    # Convert ObjectId to string
    if emergency_data and "_id" in emergency_data:
        emergency_data["_id"] = str(emergency_data["_id"])
    if medical_data and "_id" in medical_data:
        medical_data["_id"] = str(medical_data["_id"])

    return {
        "call_id": call_id,
        "emergency_details": emergency_data or "No emergency data",
        "medical_record_details": medical_data or "No medical record data"
    }


@app.get("/")
def home():
    return {"message": "Welcome to RakshakAI Emergency & Medical Record API"}
