import streamlit as st
import cv2
import numpy as np
from PIL import Image

from detector import load_yolo_model, run_detection
from llama_vision_detector import detect_with_llama_vision
from width_depth import calculate_cm_per_pixel
from utils.water_detection import detect_water_in_crop
from nvidia_llama_detector import detect_with_nvidia_llama
from gemini_detector import detect_with_gemini

st.set_page_config(page_title="Pothole Detector", layout="wide")
st.title("🕳️ Pothole Detection")

# ---------------- Sidebar ----------------
detection_method = st.sidebar.radio(
    "Detection method",
    ["YOLO (best.pt)", "LLM - GPT-4o-mini", "LLM - NVIDIA Llama Vision", "LLM - Gemini"]
)

conf_threshold = 0.35
iou_threshold = 0.45

if detection_method == "YOLO (best.pt)":
    st.sidebar.subheader("YOLO settings")
    conf_threshold = st.sidebar.slider("Confidence threshold", 0.05, 0.95, 0.35, 0.05)
    iou_threshold = st.sidebar.slider("IoU threshold", 0.05, 0.95, 0.45, 0.05)

st.sidebar.markdown("---")
with st.sidebar.expander("Width calibration (optional)"):
    use_calibration = st.checkbox("Enable width calibration", value=False)
    camera_height_m = st.number_input("Camera height (m)", 0.5, 2.5, 1.2, 0.1)
    tilt_angle_deg = st.number_input("Tilt angle (°)", 10, 90, 45, 1)

# ---------------- Main area ----------------
uploaded_file = st.file_uploader("Upload a road photo", type=["jpg", "jpeg", "png"])

if uploaded_file is not None:
    image = Image.open(uploaded_file).convert("RGB")
    img_array = np.array(image)
    img_h, img_w = img_array.shape[:2]

    col1, col2 = st.columns(2)
    with col1:
        st.subheader("Input image")
        st.image(image, use_column_width=True)

    detect_clicked = st.button("🔍 Detect potholes", type="primary")

    if detect_clicked:
        annotated_img = img_array.copy()
        pothole_boxes = []  # list of (x1, y1, x2, y2)

        with st.spinner("Detecting..."):
            if detection_method == "YOLO (best.pt)":
                yolo_model = load_yolo_model()
                boxes = run_detection(yolo_model, img_array, conf_threshold, iou_threshold)
                for box in boxes:
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    pothole_boxes.append((x1, y1, x2, y2))

            elif detection_method == "LLM - GPT-4o-mini":
                predictions, error = detect_with_llama_vision(image)  # this file currently uses gpt-4o-mini
                if error:
                    st.error(f"GPT-4o-mini detection error: {error}")
                for p in predictions:
                    y1n, x1n, y2n, x2n = p["box_2d"]
                    x1 = int((x1n / 1000) * img_w)
                    y1 = int((y1n / 1000) * img_h)
                    x2 = int((x2n / 1000) * img_w)
                    y2 = int((y2n / 1000) * img_h)
                    pothole_boxes.append((x1, y1, x2, y2))

            elif detection_method == "LLM - NVIDIA Llama Vision":
                predictions, error = detect_with_nvidia_llama(image)
                if error:
                    st.error(f"NVIDIA Llama detection error: {error}")
                for p in predictions:
                    y1n, x1n, y2n, x2n = p["box_2d"]
                    x1 = int((x1n / 1000) * img_w)
                    y1 = int((y1n / 1000) * img_h)
                    x2 = int((x2n / 1000) * img_w)
                    y2 = int((y2n / 1000) * img_h)
                    pothole_boxes.append((x1, y1, x2, y2))

            else:  # LLM - Gemini
                predictions, error = detect_with_gemini(image)
                gemini_details = []
            if error:
                st.error(f"Gemini detection error: {error}")
            for p in predictions:
                y1n, x1n, y2n, x2n = p["box_2d"]
                x1 = int((x1n / 1000) * img_w)
                y1 = int((y1n / 1000) * img_h)
                x2 = int((x2n / 1000) * img_w)
                y2 = int((y2n / 1000) * img_h)
                pothole_boxes.append((x1, y1, x2, y2))
                gemini_details.append({
                    "confidence": p.get("confidence", None),
                    "size_category": p.get("size_category", "unknown"),
                    "estimated_width_cm_range": p.get("estimated_width_cm_range", "N/A"),
                })

        # --- Water detection per box, using your heuristic ---
        water_count = 0
        for (x1, y1, x2, y2) in pothole_boxes:
        # Clamp coordinates to valid image bounds
            x1, x2 = max(0, min(x1, img_w)), max(0, min(x2, img_w))
            y1, y2 = max(0, min(y1, img_h)), max(0, min(y2, img_h))

            # Skip degenerate/invalid boxes (zero or negative width/height)
            if x2 <= x1 or y2 <= y1:
                continue

            crop_region = img_array[y1:y2, x1:x2]
            if crop_region.size == 0:
                continue

            crop_bgr = cv2.cvtColor(crop_region, cv2.COLOR_RGB2BGR)
            has_water, ratio = detect_water_in_crop(crop_bgr)
            if has_water:
                water_count += 1

            color = (0, 100, 255) if has_water else (255, 0, 0)  # blue=water, red=dry
            cv2.rectangle(annotated_img, (x1, y1), (x2, y2), color, 3)

        with col2:
            st.subheader("Detections")
            st.image(annotated_img, use_column_width=True)

        # --- Bottom metrics row ---
        st.markdown("---")
        m1, m2, m3 = st.columns(3)
        m1.metric("Potholes detected", len(pothole_boxes))
        m2.metric("Contain water", water_count)
        m3.metric("Calibrated?", "Yes (cm)" if use_calibration else "No (px only)")

        # --- Per-pothole width, if calibration enabled ---
        if use_calibration and len(pothole_boxes) > 0:
            st.subheader("Pothole details")
            for i, (x1, y1, x2, y2) in enumerate(pothole_boxes):
                center_y = (y1 + y2) / 2
                # NOTE: calculate_cm_per_pixel currently uses fixed defaults in width_depth.py;
                # pass camera_height_m/tilt_angle_deg through if you update that function's signature
                calc = calculate_cm_per_pixel(img_h, img_w, center_y)
                with st.expander(f"Pothole #{i+1}"):
                    if calc:
                        cm_per_px, distance_m = calc
                        st.write(f"Width: **{(x2 - x1) * cm_per_px:.1f} cm**")
                    else:
                        st.write("Could not calibrate for this position.")
else:
    st.info("Upload a photo to begin.")
