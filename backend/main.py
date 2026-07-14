from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Request, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import logging
import math
from ultralytics import YOLO
import cv2
import numpy as np
from typing import List, Optional
from sqlalchemy.orm import Session
import database as db
import s3_utils
from io import BytesIO

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize database
db.init_db()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class PotholeBase(BaseModel):
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

class PotholeCreate(PotholeBase):
    id: str

class PotholeUpdate(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    address: Optional[str] = None
    status: Optional[str] = None
    reportedBy: Optional[str] = None
    reportedDate: Optional[str] = None
    severity: Optional[str] = None
    imageUrl: Optional[str] = None
    estSize: Optional[str] = None
    estDepth: Optional[str] = None
    fixType: Optional[str] = None
    estCost: Optional[str] = None

class Pothole(PotholeBase):
    id: str
    class Config:
        orm_mode = True

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
async def get_potholes(db_session: Session = Depends(db.get_db)):
    return db_session.query(db.Pothole).all()

@app.get("/api/potholes/{pothole_id}", response_model=Pothole)
async def get_pothole(pothole_id: str, db_session: Session = Depends(db.get_db)):
    pothole = db_session.query(db.Pothole).filter(db.Pothole.id == pothole_id).first()
    if not pothole:
        raise HTTPException(status_code=404, detail="Pothole not found")
    return pothole

@app.post("/api/potholes", response_model=Pothole)
async def create_pothole(pothole: PotholeCreate, db_session: Session = Depends(db.get_db)):
    db_pothole = db.Pothole(**pothole.dict())
    db_session.add(db_pothole)
    db_session.commit()
    db_session.refresh(db_pothole)
    return db_pothole

@app.put("/api/potholes/{pothole_id}", response_model=Pothole)
async def update_pothole(pothole_id: str, pothole_update: PotholeUpdate, db_session: Session = Depends(db.get_db)):
    db_pothole = db_session.query(db.Pothole).filter(db.Pothole.id == pothole_id).first()
    if not db_pothole:
        raise HTTPException(status_code=404, detail="Pothole not found")
    
    update_data = pothole_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_pothole, key, value)
        
    db_session.commit()
    db_session.refresh(db_pothole)
    return db_pothole

@app.delete("/api/potholes/{pothole_id}", status_code=204)
async def delete_pothole(pothole_id: str, db_session: Session = Depends(db.get_db)):
    db_pothole = db_session.query(db.Pothole).filter(db.Pothole.id == pothole_id).first()
    if not db_pothole:
        raise HTTPException(status_code=404, detail="Pothole not found")
    
    db_session.delete(db_pothole)
    db_session.commit()
    return Response(status_code=204)

@app.post("/api/analyze")
async def analyze_image(
    request: Request,
    db_session: Session = Depends(db.get_db),
    image: UploadFile = File(...),
    camera_height_m: float = Form(...),
    tilt_angle_deg: float = Form(...),
    fov_vertical_deg: float = Form(...),
    fov_horizontal_deg: float = Form(...),
    conf_threshold: float = Form(0.4)
):
    # Read image into memory
    image_bytes = await image.read()
    
    # Upload original image to S3 from memory
    original_s3_url = s3_utils.upload_file_obj_to_s3(BytesIO(image_bytes), f"original/{image.filename}")
    if not original_s3_url:
        raise HTTPException(status_code=500, detail="Failed to upload original image to S3.")

    # Perform analysis
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if not model:
        raise HTTPException(status_code=500, detail="AI model not loaded.")

    results = model.predict(img, conf=conf_threshold)
    result = results[0]
    boxes = result.boxes
    annotated_img = result.plot() # Use the annotated image from the model
    img_h, img_w = annotated_img.shape[:2]

    # Upload annotated image to S3 from memory
    is_success, buffer = cv2.imencode(".jpg", annotated_img)
    if not is_success:
        raise HTTPException(status_code=500, detail="Failed to encode annotated image.")
    
    annotated_image_filename = f"{os.path.splitext(image.filename)[0]}_annotated.jpg"
    annotated_s3_url = s3_utils.upload_file_obj_to_s3(BytesIO(buffer), f"annotated/{annotated_image_filename}")
    if not annotated_s3_url:
        raise HTTPException(status_code=500, detail="Failed to upload annotated image to S3.")

    # Create Analysis Session in DB
    camera_params = {
        "camera_height_m": camera_height_m, "tilt_angle_deg": tilt_angle_deg,
        "fov_vertical_deg": fov_vertical_deg, "fov_horizontal_deg": fov_horizontal_deg
    }
    new_session = db.AnalysisSession(
        original_image_url=original_s3_url,
        annotated_image_url=annotated_s3_url,
        camera_params=camera_params
    )
    db_session.add(new_session)
    db_session.commit()
    db_session.refresh(new_session)

    pothole_details = []
    for i, box in enumerate(boxes):
        x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
        conf = float(box.conf[0])
        width_px = x2 - x1
        center_y = (y1 + y2) / 2
        
        calc_result = calculate_cm_per_pixel(
            camera_height_m, tilt_angle_deg, fov_vertical_deg,
            fov_horizontal_deg, img_h, img_w, center_y
        )
        
        est_dist = round(calc_result[1], 2) if calc_result else None
        est_width = round(width_px * calc_result[0], 1) if calc_result else None

        db_pothole = db.DetectedPothole(
            session_id=new_session.id,
            pothole_id_in_image=i + 1,
            confidence=conf,
            box_pixels={"x1": x1, "y1": y1, "x2": x2, "y2": y2},
            estimated_distance_m=est_dist,
            estimated_width_cm=est_width
        )
        db_session.add(db_pothole)
        pothole_details.append({
            "pothole_id_in_image": db_pothole.pothole_id_in_image,
            "confidence": db_pothole.confidence,
            "estimated_distance_m": db_pothole.estimated_distance_m,
            "estimated_width_cm": db_pothole.estimated_width_cm,
        })

    db_session.commit()

    return {
        "session_id": new_session.id,
        "total_potholes_detected": len(boxes),
        "original_image_url": original_s3_url,
        "annotated_image_url": annotated_s3_url,
        "pothole_details": pothole_details
    }
