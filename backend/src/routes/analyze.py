from fastapi import APIRouter, File, UploadFile, Form, Depends
from typing import Optional

from ..controllers import analyze_controller

router = APIRouter()

@router.post("/analyze")
async def analyze_image_route(
    image: UploadFile = File(...),
    detection_method: str = Form(...),
    user_pothole_count: Optional[int] = Form(None),
    message: Optional[str] = Form(None),
    camera_height_m: Optional[float] = Form(None),
    tilt_angle_deg: Optional[float] = Form(None),
    fov_vertical_deg: Optional[float] = Form(None),
    fov_horizontal_deg: Optional[float] = Form(None),
    conf_threshold: Optional[float] = Form(0.4)
):
    return await analyze_controller.analyze_image(
        image,
        detection_method,
        user_pothole_count,
        message,
        camera_height_m,
        tilt_angle_deg,
        fov_vertical_deg,
        fov_horizontal_deg,
        conf_threshold
    )