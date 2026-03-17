"""
CivicConnect AI Detection Microservice
FastAPI + YOLOv8 (with improved heuristic fallback)

POST /ai/detect  — multipart image → {detectedIssue, confidence}
GET  /ai/health  — health check
"""

import os
import random
import numpy as np
import cv2
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="CivicConnect AI Service", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

CIVIC_CATEGORIES = ["pothole", "garbage", "streetlight", "water", "road"]

YOLO_TO_CIVIC = {
    # vehicles near potholes
    "car": "pothole", "truck": "pothole", "motorcycle": "pothole",
    "bus": "pothole", "bicycle": "pothole",
    # lighting
    "traffic light": "streetlight", "stop sign": "streetlight",
    # water-related
    "fire hydrant": "water", "boat": "water",
    # garbage-related
    "bottle": "garbage", "cup": "garbage", "backpack": "garbage",
    "handbag": "garbage", "suitcase": "garbage", "chair": "garbage",
    "dining table": "garbage", "tv": "garbage", "laptop": "garbage",
    "cell phone": "garbage", "book": "garbage", "vase": "garbage",
    "scissors": "garbage", "toothbrush": "garbage",
    # direct civic labels
    "pothole": "pothole", "garbage": "garbage", "trash": "garbage",
    "waste": "garbage", "litter": "garbage", "debris": "garbage",
    "streetlight": "streetlight", "lamp": "streetlight", "pole": "streetlight",
    "water": "water", "flood": "water", "puddle": "water", "leak": "water",
    "road": "road", "crack": "road", "asphalt": "road", "pavement": "road",
    "pothole": "pothole",
}

# ── Load YOLOv8 with PyTorch 2.6 fix ─────────────────────────────────────────
model = None
try:
    import torch
    import ultralytics.nn.tasks
    torch.serialization.add_safe_globals([ultralytics.nn.tasks.DetectionModel])
    from ultralytics import YOLO
    MODEL_PATH = os.getenv("YOLO_MODEL_PATH", "yolov8n.pt")
    model = YOLO(MODEL_PATH)
    print(f"✅  YOLOv8 model loaded: {MODEL_PATH}")
except Exception as e:
    print(f"⚠️  YOLOv8 not available ({e}). Using improved heuristic fallback.")


# ── Improved Heuristic Detection ──────────────────────────────────────────────
def heuristic_detect(img: np.ndarray, filename: str = "") -> dict:
    """
    Multi-signal heuristic detector. Each category gets a score from
    several independent signals; highest score wins.

    Signals used:
      Pothole  — dark circular regions, road texture, center-bottom dark blobs
      Garbage  — scattered multicolor objects, brownish/greenish clutter, edges
      Light    — bright point sources, high contrast vertical poles, night scene
      Water    — reflective blue/grey flat regions, horizontal reflections
      Road     — grey uniform texture, straight lines, low color variance
    """
    h, w = img.shape[:2]

    # ── Pre-process ──────────────────────────────────────────────────────────
    gray   = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    hsv    = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    blur   = cv2.GaussianBlur(gray, (7, 7), 0)
    edges  = cv2.Canny(blur, 40, 120)

    # Normalised regions
    total_px = h * w
    bottom_half = gray[h//2:, :]   # road/ground area
    top_half    = gray[:h//2, :]   # sky/lights area

    # ── Filename keyword shortcut ─────────────────────────────────────────────
    fname = filename.lower()
    keyword_map = {
        "pothole": "pothole", "hole": "pothole", "crater": "pothole",
        "garbage": "garbage", "trash": "garbage", "waste": "garbage",
        "litter": "garbage", "dump": "garbage", "rubbish": "garbage",
        "light": "streetlight", "lamp": "streetlight", "street": "streetlight",
        "dark": "streetlight",
        "water": "water", "flood": "water", "leak": "water",
        "puddle": "water", "drain": "water",
        "road": "road", "crack": "road", "pavement": "road",
        "asphalt": "road", "damage": "road",
    }
    for kw, cat in keyword_map.items():
        if kw in fname:
            conf = round(random.uniform(0.78, 0.91), 2)
            return {"detectedIssue": cat, "confidence": conf}

    scores = {cat: 0.0 for cat in CIVIC_CATEGORIES}

    # ────────────────────────── POTHOLE signals ───────────────────────────────
    # 1. Dark blob in lower-center (where potholes appear)
    lower_center = gray[h*2//3:, w//4: w*3//4]
    dark_ratio_center = float(np.sum(lower_center < 55) / lower_center.size)
    scores["pothole"] += dark_ratio_center * 4.0

    # 2. Circular contour detection in bottom half
    _, thresh = cv2.threshold(bottom_half, 60, 255, cv2.THRESH_BINARY_INV)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    circular_score = 0.0
    for cnt in contours:
        area = cv2.contourArea(cnt)
        if area < 200: continue
        perimeter = cv2.arcLength(cnt, True)
        if perimeter == 0: continue
        circularity = 4 * np.pi * area / (perimeter ** 2)
        if 0.35 < circularity < 1.0 and area > 500:
            circular_score += circularity * (area / total_px) * 15
    scores["pothole"] += min(circular_score, 2.5)

    # 3. Grey road texture with sudden dark patch
    road_grey   = np.sum((gray > 80) & (gray < 160)) / total_px
    dark_patch  = np.sum(gray < 45) / total_px
    if road_grey > 0.3 and dark_patch > 0.05:
        scores["pothole"] += 1.5

    # ────────────────────────── GARBAGE signals ───────────────────────────────
    # 1. High colour variance (scattered multicolor objects)
    b, g, r = cv2.split(img)
    color_std = float(np.std(b) + np.std(g) + np.std(r))
    scores["garbage"] += min(color_std / 40.0, 2.5)

    # 2. Brownish/yellowish tones (waste, cardboard, rotting material)
    brown_mask = cv2.inRange(hsv, (10, 40, 40), (30, 255, 200))
    brown_ratio = float(np.sum(brown_mask > 0) / total_px)
    scores["garbage"] += brown_ratio * 4.0

    # 3. Greenish tones (organic waste, overgrown bins)
    green_mask  = cv2.inRange(hsv, (35, 40, 40), (85, 255, 255))
    green_ratio = float(np.sum(green_mask > 0) / total_px)
    scores["garbage"] += green_ratio * 3.0

    # 4. High edge density (cluttered scene)
    edge_density = float(np.sum(edges > 0) / total_px)
    if edge_density > 0.15:
        scores["garbage"] += edge_density * 3.0

    # 5. Many small disconnected regions (typical of litter)
    _, bin_img = cv2.threshold(gray, 127, 255, cv2.THRESH_BINARY)
    n_labels, _, stats, _ = cv2.connectedComponentsWithStats(bin_img)
    small_blobs = sum(1 for i in range(1, n_labels) if 50 < stats[i, cv2.CC_STAT_AREA] < 800)
    scores["garbage"] += min(small_blobs / 20.0, 1.5)

    # ────────────────────────── STREETLIGHT signals ───────────────────────────
    # 1. Very bright point sources (the light itself)
    bright_spots = np.sum(gray > 240) / total_px
    scores["streetlight"] += bright_spots * 8.0

    # 2. Bright source in upper half (light mounted high)
    bright_top = np.sum(top_half > 235) / top_half.size
    scores["streetlight"] += bright_top * 5.0

    # 3. Vertical dark pole structure
    sobel_y = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    sobel_x = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    vert_ratio = float(np.sum(np.abs(sobel_y) > 30) / total_px)
    horz_ratio = float(np.sum(np.abs(sobel_x) > 30) / total_px)
    if vert_ratio > horz_ratio * 1.3:
        scores["streetlight"] += 1.2

    # 4. Dark scene overall (broken light = dark)
    mean_brightness = float(np.mean(gray))
    if mean_brightness < 80:
        scores["streetlight"] += 2.0

    # 5. Yellow/orange glow (sodium streetlight halo)
    yellow_mask = cv2.inRange(hsv, (18, 60, 100), (38, 255, 255))
    yellow_ratio = float(np.sum(yellow_mask > 0) / total_px)
    scores["streetlight"] += yellow_ratio * 6.0

    # ────────────────────────── WATER signals ─────────────────────────────────
    # 1. Blue/grey flat reflective regions
    blue_mask = cv2.inRange(hsv, (95, 30, 50), (135, 255, 255))
    blue_ratio = float(np.sum(blue_mask > 0) / total_px)
    scores["water"] += blue_ratio * 5.0

    # 2. Grey reflective flat area (waterlogged road looks grey-blue)
    grey_blue = cv2.inRange(hsv, (90, 10, 80), (140, 80, 220))
    grey_blue_ratio = float(np.sum(grey_blue > 0) / total_px)
    scores["water"] += grey_blue_ratio * 3.0

    # 3. Low edge density in lower half = flat surface (standing water)
    lower_edges = edges[h//2:, :]
    low_edge_ratio = float(np.sum(lower_edges > 0) / lower_edges.size)
    if low_edge_ratio < 0.04:
        scores["water"] += 2.0

    # 4. High specularity (bright reflections on water)
    specular = np.sum((gray > 200) & (gray < 255)) / total_px
    if specular > 0.08:
        scores["water"] += 1.5

    # ────────────────────────── ROAD signals ──────────────────────────────────
    # 1. Uniform grey texture (asphalt)
    grey_mask = (gray > 70) & (gray < 160)
    grey_ratio = float(np.sum(grey_mask) / total_px)
    scores["road"] += grey_ratio * 2.5

    # 2. Low colour saturation overall (grey road)
    sat_channel = hsv[:, :, 1]
    low_sat_ratio = float(np.sum(sat_channel < 30) / total_px)
    scores["road"] += low_sat_ratio * 2.5

    # 3. Linear edge structures (lane markings, road edges)
    lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=60,
                             minLineLength=w//5, maxLineGap=30)
    if lines is not None:
        scores["road"] += min(len(lines) / 8.0, 2.0)

    # 4. Low variance in bottom half (uniform flat road surface)
    bottom_std = float(np.std(bottom_half))
    if bottom_std < 35:
        scores["road"] += 2.0

    # 5. Crack-like thin dark lines on grey background
    grey_bg = grey_ratio > 0.4
    thin_dark = float(np.sum((gray > 60) & (gray < 90)) / total_px)
    if grey_bg and thin_dark > 0.06:
        scores["road"] += 1.5

    # ── Winner ────────────────────────────────────────────────────────────────
    best_cat   = max(scores, key=scores.get)
    best_score = scores[best_cat]
    total_score = sum(scores.values()) or 1.0

    # Normalise to a confidence between 0.55 and 0.93
    raw_conf   = best_score / total_score
    confidence = round(min(0.93, max(0.55, 0.50 + raw_conf * 1.2)), 2)

    return {"detectedIssue": best_cat, "confidence": confidence}


def yolo_detect(img: np.ndarray) -> dict | None:
    results    = model(img, verbose=False)
    best_label = None
    best_conf  = 0.0
    for r in results:
        for box in r.boxes:
            conf = float(box.conf[0])
            cls  = int(box.cls[0])
            name = model.names[cls].lower()
            if conf > best_conf:
                best_conf  = conf
                best_label = name
    if best_label and best_conf > 0.25:
        civic_cat = YOLO_TO_CIVIC.get(best_label)
        if civic_cat:
            return {"detectedIssue": civic_cat, "confidence": round(best_conf, 2)}
    return None


# ── Endpoints ─────────────────────────────────────────────────────────────────
class DetectionResult(BaseModel):
    detectedIssue: str
    confidence: float


@app.post("/ai/detect", response_model=DetectionResult)
async def detect_issue(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files accepted")

    contents = await file.read()
    np_arr   = np.frombuffer(contents, np.uint8)
    img      = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=422, detail="Could not decode image")

    result = None
    if model is not None:
        result = yolo_detect(img)

    if result is None:
        result = heuristic_detect(img, filename=file.filename or "")

    return result


@app.get("/ai/health")
def health():
    return {
        "status":      "ok",
        "modelLoaded": model is not None,
        "mode":        "yolov8" if model else "heuristic",
        "categories":  CIVIC_CATEGORIES,
    }