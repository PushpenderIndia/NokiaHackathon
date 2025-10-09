import os
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel
from pymongo import MongoClient
from dotenv import load_dotenv
from urllib.parse import quote_plus
from NokiaIntegration import NokiaIntegration

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

# Connect to MongoDB using synchronous client (better for serverless)
client = MongoClient(MONGODB_URI)
db = client[DB_NAME]

# Initialize FastAPI
app = FastAPI(title="RakshakAI Multi-Collection API")
nokia_integration = NokiaIntegration()

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

@app.get("/device_location")
def get_device_location():
    location = nokia_integration.get_device_location()
    return {"longitude": location.longitude, "latitude": location.latitude}

@app.get("/device_status")
def get_device_status():
    status = nokia_integration.get_device_status()
    return {"status": status}

@app.post("/emergency_detected")
def create_emergency_record(payload: Emergency):
    try:
        collection = db["emergency"]
        payload_dict = payload.model_dump() if hasattr(payload, 'model_dump') else payload.dict()
        result = collection.insert_one(payload_dict)
        return {"message": "Emergency record stored successfully", "data": payload_dict, "id": str(result.inserted_id)}
    except Exception as e:
        print(f"Error in /emergency_detected: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/medical_record")
def create_medical_record(payload: MedicalRecord):
    try:
        collection = db["medical_record"]
        payload_dict = payload.model_dump() if hasattr(payload, 'model_dump') else payload.dict()
        result = collection.insert_one(payload_dict)
        return {"message": "Medical record stored successfully", "data": payload_dict, "id": str(result.inserted_id)}
    except Exception as e:
        print(f"Error in /medical_record: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/status")
def get_status(call_id: str = Query(..., description="Unique call ID")):
    try:
        emergency_col = db["emergency"]
        medical_col = db["medical_record"]

        emergency_data = emergency_col.find_one({"call_id": call_id})
        medical_data = medical_col.find_one({"call_id": call_id})

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
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in /status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/")
def home():
    return {"message": "Welcome to RakshakAI Emergency & Medical Record API"}

@app.get("/debug")
def debug():
    """Debug endpoint to check MongoDB connection"""
    try:
        # Try to ping MongoDB
        client.admin.command('ping')
        return {
            "mongodb_connected": True,
            "database": DB_NAME,
            "env_vars_set": {
                "MONGO_USERNAME": bool(os.getenv("MONGO_USERNAME")),
                "MONGO_PASSWORD": bool(os.getenv("MONGO_PASSWORD")),
                "MONGO_CLUSTER": bool(os.getenv("MONGO_CLUSTER")),
                "MONGO_DB_NAME": bool(os.getenv("MONGO_DB_NAME"))
            }
        }
    except Exception as e:
        return {
            "mongodb_connected": False,
            "error": str(e),
            "env_vars_set": {
                "MONGO_USERNAME": bool(os.getenv("MONGO_USERNAME")),
                "MONGO_PASSWORD": bool(os.getenv("MONGO_PASSWORD")),
                "MONGO_CLUSTER": bool(os.getenv("MONGO_CLUSTER")),
                "MONGO_DB_NAME": bool(os.getenv("MONGO_DB_NAME"))
            }
        }
