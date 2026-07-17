import os
import math
import cv2
import numpy as np
from ultralytics import YOLO
import logging

logger = logging.getLogger(__name__)

MODEL_PATH = os.path.abspath("src/models/best1.pt")
model = None
try:
    logger.info(f"Loading model from path: {MODEL_PATH}")
    if os.path.exists(MODEL_PATH):
        model = YOLO(MODEL_PATH)
        logger.info("Model loaded successfully.")
    else:
        logger.error(f"Model file not found at path: {MODEL_PATH}")
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

def process_image_with_yolo(image_bytes, camera_height_m, tilt_angle_deg, fov_vertical_deg, fov_horizontal_deg, conf_threshold):
    if not model:
        raise Exception("AI model not loaded.")

    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    results = model.predict(img, conf=conf_threshold)
    result = results[0]
    boxes = result.boxes

    pothole_details = []
    annotated_img = img.copy()

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

    return annotated_img, pothole_details
