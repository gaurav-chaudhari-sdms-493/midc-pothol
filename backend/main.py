from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import shutil
import os
import json
import logging
import math
from ultralytics import YOLO
import cv2
import numpy as np
from typing import List, Optional

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# --- Static File Serving ---
UPLOADS_DIR = "uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pothole Data Management ---
POTHOLES_DB = "potholes.json"

class Pothole(BaseModel):
    id: str
    lat: float
    lng: float
    address: str
    status: str
    reportedBy: str
    reportedDate: str
    severity: str
    imageUrl: str
    estSize: Optional[str] = None
    estDepth: Optional[str] = None
    fixType: Optional[str] = None
    estCost: Optional[str] = None

def read_potholes_db() -> List[Pothole]:
    if not os.path.exists(POTHOLES_DB):
        return []
    with open(POTHOLES_DB, "r") as f:
        data = json.load(f)
        return [Pothole(**item) for item in data]

def write_potholes_db(potholes: List[Pothole]):
    with open(POTHOLES_DB, "w") as f:
        json.dump([p.dict() for p in potholes], f, indent=2)

# Load the model
MODEL_PATH = os.path.abspath("best.pt")
model = None
try:
    logger.info(f"Loading model from path: {MODEL_PATH}")
    model = YOLO(MODEL_PATH)
    logger.info("Model loaded successfully.")
except Exception as e:
    logger.error(f"Error loading model: {e}", exc_info=True)

def calculate_cm_per_pixel(camera_height_m, tilt_angle_deg, fov_vertical_deg,
                             fov_horizontal_deg, image_height_px, image_width_px,
                             pothole_center_y_px):
    tilt_rad = math.radians(tilt_angle_deg)
    fov_v_rad = math.radians(fov_vertical_deg)
    fov_h_rad = math.radians(fov_horizontal_deg)
    pixel_offset_ratio = (pothole_center_y_px - image_height_px / 2) / (image_height_px / 2)
    angle_offset = pixel_offset_ratio * (fov_v_rad / 2)
    effective_angle = tilt_rad + angle_offset
    if effective_angle <= 0.05:
        return None
    distance_m = camera_height_m / math.tan(effective_angle)
    real_width_at_distance_m = 2 * distance_m * math.tan(fov_h_rad / 2)
    cm_per_pixel = (real_width_at_distance_m * 100) / image_width_px
    return cm_per_pixel, distance_m

@app.get("/api/potholes", response_model=List[Pothole])
async def get_potholes():
    return read_potholes_db()

@app.get("/api/potholes/{pothole_id}", response_model=Pothole)
async def get_pothole(pothole_id: str):
    potholes = read_potholes_db()
    for pothole in potholes:
        if pothole.id == pothole_id:
            return pothole
    raise HTTPException(status_code=404, detail="Pothole not found")

@app.post("/api/potholes", response_model=Pothole)
async def create_pothole(pothole: Pothole):
    potholes = read_potholes_db()
    potholes.append(pothole)
    write_potholes_db(potholes)
    return pothole

@app.post("/api/analyze")
async def analyze_image(
    request: Request,
    image: UploadFile = File(...),
    camera_height_m: float = Form(...),
    tilt_angle_deg: float = Form(...),
    fov_vertical_deg: float = Form(...),
    fov_horizontal_deg: float = Form(...),
    conf_threshold: float = Form(0.4)
):
    image_path = os.path.join(UPLOADS_DIR, image.filename)
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    if not model:
        raise HTTPException(status_code=500, detail="AI model not loaded.")

    results = model.predict(image_path, conf=conf_threshold)
    result = results[0]
    boxes = result.boxes
    annotated_img = cv2.imread(image_path)
    img_h, img_w = annotated_img.shape[:2]

    pothole_details = []
    for i, box in enumerate(boxes):
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        conf = float(box.conf[0])
        cls = int(box.cls[0])
        width_px = x2 - x1
        center_y = (y1 + y2) / 2
        cv2.rectangle(annotated_img, (x1, y1), (x2, y2), (255, 0, 0), 3)
        label = f"#{i+1} ({conf:.2f})"
        (label_w, label_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
        cv2.rectangle(annotated_img, (x1, y1 - label_h - 10), (x1 + label_w + 6, y1), (255, 0, 0), -1)
        cv2.putText(annotated_img, label, (x1 + 3, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        calc_result = calculate_cm_per_pixel(
            camera_height_m, tilt_angle_deg, fov_vertical_deg,
            fov_horizontal_deg, img_h, img_w, center_y
        )
        detail = {
            "pothole_id": i + 1,
            "box_pixels": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
            "confidence": conf,
            "class_id": cls,
            "class_name": model.names[cls],
            "width_pixels": width_px,
        }
        if calc_result is None:
            detail["error"] = "Cannot estimate width — camera angle too shallow."
            detail["estimated_distance_m"] = None
            detail["estimated_width_cm"] = None
            detail["calibration_cm_per_px"] = None
        else:
            cm_per_px, distance_m = calc_result
            width_cm = width_px * cm_per_px
            detail["error"] = None
            detail["estimated_distance_m"] = round(distance_m, 2)
            detail["estimated_width_cm"] = round(width_cm, 1)
            detail["calibration_cm_per_px"] = round(cm_per_px, 3)
        pothole_details.append(detail)

    base, ext = os.path.splitext(image.filename)
    annotated_image_filename = f"{base}_annotated{ext}"
    annotated_image_path = os.path.join(UPLOADS_DIR, annotated_image_filename)
    cv2.imwrite(annotated_image_path, annotated_img)

    base_url = str(request.base_url)
    original_url = f"{base_url}uploads/{image.filename}"
    annotated_url = f"{base_url}uploads/{annotated_image_filename}"

    return {
        "total_potholes_detected": len(boxes),
        "original_image_url": original_url,
        "annotated_image_url": annotated_url,
        "pothole_details": pothole_details
    }

# The old /api/report endpoint is no longer needed as its functionality is covered by the new /api/potholes POST endpoint.
# If you still need it, you can uncomment it.
# @app.post("/api/report") ...