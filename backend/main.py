from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
import logging
import math
from ultralytics import YOLO
import cv2
import numpy as np
from typing import List, Optional, Any
from sqlalchemy.orm import Session
import database as db
import s3_utils
from io import BytesIO
import datetime

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
class ReportBase(BaseModel):
    original_image_url: str
    annotated_image_url: str
    camera_params: Optional[Any] = None
    pothole_details: Optional[Any] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    address: Optional[str] = None
    status: Optional[str] = "Pending Analysis"
    reportedBy: Optional[str] = None
    reportedDate: Optional[datetime.datetime] = None
    severity: Optional[str] = None
    estSize: Optional[str] = None
    message: Optional[str] = None

class ReportCreate(ReportBase):
    pass

class ReportUpdate(BaseModel):
    lat: Optional[float] = None
    lng: Optional[float] = None
    address: Optional[str] = None
    status: Optional[str] = None
    reportedBy: Optional[str] = None
    severity: Optional[str] = None
    estSize: Optional[str] = None
    message: Optional[str] = None

class Report(ReportBase):
    id: int
    class Config:
        from_attributes = True

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

# --- API Endpoints ---
@app.get("/api/reports", response_model=List[Report])
async def get_reports(
    reportedBy: Optional[str] = None, 
    status: Optional[str] = None, 
    db_session: Session = Depends(db.get_db)
):
    query = db_session.query(db.Report)
    if reportedBy:
        query = query.filter(db.Report.reportedBy == reportedBy)
    if status:
        query = query.filter(db.Report.status == status)
    return query.all()

@app.get("/api/reports/{report_id}", response_model=Report)
async def get_report(report_id: int, db_session: Session = Depends(db.get_db)):
    report = db_session.query(db.Report).filter(db.Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@app.put("/api/reports/{report_id}", response_model=Report)
async def update_report(report_id: int, report_update: ReportUpdate, db_session: Session = Depends(db.get_db)):
    db_report = db_session.query(db.Report).filter(db.Report.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    update_data = report_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_report, key, value)
        
    db_report.reportedDate = datetime.datetime.utcnow() # Update date
    
    db_session.commit()
    db_session.refresh(db_report)
    return db_report

@app.delete("/api/reports/{report_id}", status_code=204)
async def delete_report(report_id: int, db_session: Session = Depends(db.get_db)):
    db_report = db_session.query(db.Report).filter(db.Report.id == report_id).first()
    if not db_report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    db_session.delete(db_report)
    db_session.commit()
    return Response(status_code=204)

@app.post("/api/analyze", response_model=Report)
async def analyze_image(
    db_session: Session = Depends(db.get_db),
    image: UploadFile = File(...),
    camera_height_m: float = Form(...),
    tilt_angle_deg: float = Form(...),
    fov_vertical_deg: float = Form(...),
    fov_horizontal_deg: float = Form(...),
    conf_threshold: float = Form(0.4),
    message: Optional[str] = Form(None)
):
    # Create a placeholder report to get an ID
    new_report = db.Report(
        original_image_url="placeholder",
        annotated_image_url="placeholder",
        status="Processing",
        message=message
    )
    db_session.add(new_report)
    db_session.commit()
    db_session.refresh(new_report)
    
    report_id = new_report.id
    
    image_bytes = await image.read()
    
    # Name and upload original image
    original_filename = f"original/{report_id}.jpg"
    original_s3_url = s3_utils.upload_file_obj_to_s3(BytesIO(image_bytes), original_filename)
    if not original_s3_url:
        raise HTTPException(status_code=500, detail="Failed to upload original image.")

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    annotated_img = img.copy()
    
    if not model:
        raise HTTPException(status_code=500, detail="AI model not loaded.")

    results = model.predict(img, conf=conf_threshold)
    result = results[0]
    boxes = result.boxes
    img_h, img_w = annotated_img.shape[:2]

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

        pothole_id_in_image = i + 1
        pothole_details.append({
            "pothole_id_in_image": pothole_id_in_image,
            "confidence": conf,
            "box_pixels": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
            "estimated_distance_m": est_dist,
            "estimated_width_cm": est_width
        })

        cv2.rectangle(annotated_img, (x1, y1), (x2, y2), (0, 255, 0), 2)
        label = f"Pothole #{pothole_id_in_image}: {conf:.2f}"
        (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
        cv2.rectangle(annotated_img, (x1, y1 - h - 5), (x1 + w, y1), (0, 255, 0), -1)
        cv2.putText(annotated_img, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)

    is_success, buffer = cv2.imencode(".jpg", annotated_img)
    if not is_success:
        raise HTTPException(status_code=500, detail="Failed to encode annotated image.")
    
    # Name and upload annotated image
    annotated_filename = f"annotated/{report_id}_annotated.jpg"
    annotated_s3_url = s3_utils.upload_file_obj_to_s3(BytesIO(buffer), annotated_filename)
    if not annotated_s3_url:
        raise HTTPException(status_code=500, detail="Failed to upload annotated image.")

    # Update the report with the final details
    camera_params = {
        "camera_height_m": camera_height_m, "tilt_angle_deg": tilt_angle_deg,
        "fov_vertical_deg": fov_vertical_deg, "fov_horizontal_deg": fov_horizontal_deg
    }
    new_report.original_image_url = original_s3_url
    new_report.annotated_image_url = annotated_s3_url
    new_report.camera_params = camera_params
    new_report.pothole_details = pothole_details
    new_report.status = "Analyzed"

    db_session.commit()
    db_session.refresh(new_report)

    return new_report
