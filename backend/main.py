from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
import logging
import math
import uuid
from ultralytics import YOLO
import cv2
import numpy as np
from typing import List, Optional, Any
from sqlalchemy.orm import Session
import database as db
import s3_utils
from io import BytesIO
import datetime
from src.gemini_detector import detect_with_gemini
from PIL import Image

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
    detection_method: Optional[str] = None
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
MODEL_PATH = os.path.abspath("best1.pt")
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
@app.post("/api/reports", response_model=Report)
async def create_report(report: ReportCreate, db_session: Session = Depends(db.get_db)):
    new_report = db.Report(**report.dict())
    db_session.add(new_report)
    db_session.commit()
    db_session.refresh(new_report)
    return new_report

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

@app.post("/api/analyze")
async def analyze_image(
    image: UploadFile = File(...),
    detection_method: str = Form(...),
    message: Optional[str] = Form(None),
    camera_height_m: Optional[float] = Form(None),
    tilt_angle_deg: Optional[float] = Form(None),
    fov_vertical_deg: Optional[float] = Form(None),
    fov_horizontal_deg: Optional[float] = Form(None),
    conf_threshold: Optional[float] = Form(0.4)
):
    if detection_method == "YOLO (best.pt)":
        if not all([camera_height_m, tilt_angle_deg, fov_vertical_deg, fov_horizontal_deg, conf_threshold]):
            raise HTTPException(status_code=422, detail="Missing required parameters for YOLO detection.")
        response = await analyze_image_yolo(image, camera_height_m, tilt_angle_deg, fov_vertical_deg, fov_horizontal_deg, conf_threshold, message)
    elif detection_method == "LLM - Gemini":
        response = await analyze_image_gemini(image, message)
    else:
        raise HTTPException(status_code=400, detail="Invalid detection method")
    
    response_content = response.body.decode('utf-8')
    import json
    response_data = json.loads(response_content)
    response_data['detection_method'] = detection_method
    return JSONResponse(content=response_data)


async def analyze_image_yolo(
    image: UploadFile,
    camera_height_m: float,
    tilt_angle_deg: float,
    fov_vertical_deg: float,
    fov_horizontal_deg: float,
    conf_threshold: float,
    message: Optional[str]
):
    if not model:
        raise HTTPException(status_code=500, detail="AI model not loaded.")

    image_bytes = await image.read()
    
    analysis_id = str(uuid.uuid4())
    
    original_filename = f"analysis/{analysis_id}_original.jpg"
    original_s3_url = s3_utils.upload_file_obj_to_s3(BytesIO(image_bytes), original_filename)
    if not original_s3_url:
        raise HTTPException(status_code=500, detail="Failed to upload original image.")

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    results = model.predict(img, conf=conf_threshold)
    result = results[0]
    boxes = result.boxes

    pothole_details = []
    annotated_img = img.copy()
    annotated_s3_url = original_s3_url

    if len(boxes) > 0:
        img_h, img_w = annotated_img.shape[:2]
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
        
        annotated_filename = f"analysis/{analysis_id}_annotated.jpg"
        annotated_s3_url = s3_utils.upload_file_obj_to_s3(BytesIO(buffer), annotated_filename)
        if not annotated_s3_url:
            raise HTTPException(status_code=500, detail="Failed to upload annotated image.")

    camera_params = {
        "camera_height_m": camera_height_m, "tilt_angle_deg": tilt_angle_deg,
        "fov_vertical_deg": fov_vertical_deg, "fov_horizontal_deg": fov_horizontal_deg
    }

    return JSONResponse(content={
        "original_image_url": original_s3_url,
        "annotated_image_url": annotated_s3_url,
        "camera_params": camera_params,
        "pothole_details": pothole_details,
        "message": message
    })

async def analyze_image_gemini(
    image: UploadFile,
    message: Optional[str]
):
    image_bytes = await image.read()
    
    analysis_id = str(uuid.uuid4())
    
    original_filename = f"analysis/{analysis_id}_original.jpg"
    original_s3_url = s3_utils.upload_file_obj_to_s3(BytesIO(image_bytes), original_filename)
    if not original_s3_url:
        raise HTTPException(status_code=500, detail="Failed to upload original image.")

    pil_image = Image.open(BytesIO(image_bytes)).convert("RGB")
    
    predictions, error = detect_with_gemini(pil_image)
    if error:
        raise HTTPException(status_code=500, detail=f"Gemini detection error: {error}")

    pothole_details = []
    img_array = np.array(pil_image)
    img_h, img_w = img_array.shape[:2]
    annotated_img = img_array.copy()
    annotated_s3_url = original_s3_url

    if len(predictions) > 0:
        for i, p in enumerate(predictions):
            y1n, x1n, y2n, x2n = p["box_2d"]
            x1 = int((x1n / 1000) * img_w)
            y1 = int((y1n / 1000) * img_h)
            x2 = int((x2n / 1000) * img_w)
            y2 = int((y2n / 1000) * img_h)
            
            pothole_id_in_image = i + 1
            pothole_details.append({
                "pothole_id_in_image": pothole_id_in_image,
                "confidence": p.get("confidence", None),
                "box_pixels": {"x1": x1, "y1": y1, "x2": x2, "y2": y2},
                "size_category": p.get("size_category", "unknown"),
                "estimated_width_cm_range": p.get("estimated_width_cm_range", "N/A"),
            })

            cv2.rectangle(annotated_img, (x1, y1), (x2, y2), (0, 255, 0), 2)
            label = f"Pothole #{pothole_id_in_image}"
            (w, h), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
            cv2.rectangle(annotated_img, (x1, y1 - h - 5), (x1 + w, y1), (0, 255, 0), -1)
            cv2.putText(annotated_img, label, (x1, y1 - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)

        is_success, buffer = cv2.imencode(".jpg", annotated_img)
        if not is_success:
            raise HTTPException(status_code=500, detail="Failed to encode annotated image.")
        
        annotated_filename = f"analysis/{analysis_id}_annotated.jpg"
        annotated_s3_url = s3_utils.upload_file_obj_to_s3(BytesIO(buffer), annotated_filename)
        if not annotated_s3_url:
            raise HTTPException(status_code=500, detail="Failed to upload annotated image.")

    return JSONResponse(content={
        "original_image_url": original_s3_url,
        "annotated_image_url": annotated_s3_url,
        "pothole_details": pothole_details,
        "message": message
    })