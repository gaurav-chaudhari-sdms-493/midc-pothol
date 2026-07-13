from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from potholes import potholes
import shutil
import os
from PIL import Image
import io
import logging
import math
from ultralytics import YOLO
import cv2
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
MODEL_PATH = os.path.abspath("best.pt")
model = None
try:
    logger.info(f"Loading model from path: {MODEL_PATH}")
    model = YOLO(MODEL_PATH)
    logger.info("Model loaded successfully.")
except Exception as e:
    logger.error(f"Error loading model: {e}", exc_info=True)
    # We can choose to not start the app if the model fails to load
    # raise e

def calculate_cm_per_pixel(camera_height_m, tilt_angle_deg, fov_vertical_deg,
                             fov_horizontal_deg, image_height_px, image_width_px,
                             pothole_center_y_px):
    """
    Ground-plane geometric calibration.
    Calculates how many real-world cm one pixel represents,
    specifically at the vertical position of the detected pothole.
    """
    tilt_rad = math.radians(tilt_angle_deg)
    fov_v_rad = math.radians(fov_vertical_deg)
    fov_h_rad = math.radians(fov_horizontal_deg)

    # how far this pixel row is from the image's vertical center, as a ratio (-1 to 1)
    pixel_offset_ratio = (pothole_center_y_px - image_height_px / 2) / (image_height_px / 2)
    angle_offset = pixel_offset_ratio * (fov_v_rad / 2)

    # avoid division by zero / negative distance for extreme angles
    effective_angle = tilt_rad + angle_offset
    if effective_angle <= 0.05:
        return None  # geometry breaks down (looking near/above horizon) - can't estimate

    # distance from camera to the ground point at this pixel row
    distance_m = camera_height_m / math.tan(effective_angle)

    # real-world width represented by the full image width, at that distance
    real_width_at_distance_m = 2 * distance_m * math.tan(fov_h_rad / 2)

    cm_per_pixel = (real_width_at_distance_m * 100) / image_width_px
    return cm_per_pixel, distance_m

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
    # This endpoint remains for simple reporting
    image_path = os.path.join(UPLOADS_DIR, image.filename)
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)
    
    return {
        "message": "Simple report received successfully, no analysis performed.",
        "image_path": image_path,
        "location": location,
        "landmark": landmark,
        "notes": notes,
    }

@app.post("/api/analyze")
async def analyze_image(
    image: UploadFile = File(...),
    camera_height_m: float = Form(...),
    tilt_angle_deg: float = Form(...),
    fov_vertical_deg: float = Form(...),
    fov_horizontal_deg: float = Form(...),
    conf_threshold: float = Form(0.4)
):
    # Save the uploaded image
    image_path = os.path.join(UPLOADS_DIR, image.filename)
    with open(image_path, "wb") as buffer:
        shutil.copyfileobj(image.file, buffer)

    if not model:
        raise HTTPException(status_code=500, detail="AI model not loaded.")

    # Perform prediction
    results = model.predict(image_path, conf=conf_threshold)
    result = results[0]
    boxes = result.boxes

    # --- Draw annotations on the image ---
    annotated_img = cv2.imread(image_path)
    img_h, img_w = annotated_img.shape[:2]

    pothole_details = []
    for i, box in enumerate(boxes):
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        conf = float(box.conf[0])
        cls = int(box.cls[0])
        width_px = x2 - x1
        center_y = (y1 + y2) / 2

        # Draw rectangle for the pothole
        cv2.rectangle(annotated_img, (x1, y1), (x2, y2), (255, 0, 0), 3)
        
        # Create and draw label
        label = f"#{i+1} ({conf:.2f})"
        (label_w, label_h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)
        cv2.rectangle(annotated_img, (x1, y1 - label_h - 10), (x1 + label_w + 6, y1), (255, 0, 0), -1)
        cv2.putText(annotated_img, label, (x1 + 3, y1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

        # Calculate real-world size
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

    # Save the annotated image
    base, ext = os.path.splitext(image.filename)
    annotated_image_filename = f"{base}_annotated{ext}"
    annotated_image_path = os.path.join(UPLOADS_DIR, annotated_image_filename)
    cv2.imwrite(annotated_image_path, annotated_img)

    return {
        "total_potholes_detected": len(boxes),
        "original_image_path": image_path,
        "annotated_image_path": annotated_image_path,
        "pothole_details": pothole_details
    }