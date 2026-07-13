from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from potholes import potholes
import shutil
import os
import torch
from PIL import Image
import io

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure the 'uploads' directory exists
UPLOADS_DIR = "uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)

# Load the model
# Assuming the model is in the frontend folder, relative to the backend
MODEL_PATH = "../frontend/best.pt"
model = None
try:
    model = torch.hub.load('ultralytics/yolov5', 'custom', path=MODEL_PATH)
except Exception as e:
    print(f"Error loading model: {e}")
    # We can choose to not start the app if the model fails to load
    # raise e 

@app.get("/api/potholes")
async def get_potholes():
    return potholes

@app.get("/api/potholes/{pothole_id}")
async def get_pothole(pothole_id: str):
    for pothole in potholes:
        if pothole["id"] == pothole_id:
            return pothole
    raise HTTPException(status_code=404, detail="Pothole not found")

@app.post("/api/report")
async def report_pothole(
    image: UploadFile = File(...),
    location: str = Form(...),
    landmark: str = Form(None),
    notes: str = Form(None)
):
    # Save the uploaded image to the uploads directory
    image_path = os.path.join(UPLOADS_DIR, image.filename)
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    # Perform prediction
    analysis_results = {}
    if model:
        try:
            # Read the saved image for prediction
            img = Image.open(image_path).convert("RGB")
            results = model(img)
            
            # Process results
            predictions = results.pandas().xyxy[0].to_dict(orient="records")
            analysis_results = {
                "status": "completed",
                "predictions": predictions
            }
        except Exception as e:
            print(f"Error during prediction: {e}")
            analysis_results = {
                "status": "failed",
                "message": "AI analysis could not be performed."
            }
    else:
        analysis_results = {
            "status": "failed",
            "message": "AI model not loaded. Analysis skipped."
        }

    # For now, just return a mock response
    return {
        "message": "Report received successfully",
        "image_path": image_path,
        "location": location,
        "landmark": landmark,
        "notes": notes,
        "analysis": analysis_results
    }