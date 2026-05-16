"""
model.py — Loads the trained Random Forest model and exposes a predict() function.
The model is loaded once at import time (singleton pattern).
"""

import os
import joblib
import numpy as np
import pandas as pd

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model.pkl")

# ── Singleton load ─────────────────────────────────────────────────────────────
_model = None

def _load_model():
    global _model
    if _model is None:
        if not os.path.exists(MODEL_PATH):
            raise FileNotFoundError(
                f"model.pkl not found at {MODEL_PATH}. "
                "Run `python -m app.ml.train` from the backend/ directory first."
            )
        _model = joblib.load(MODEL_PATH)
    return _model


# ── Label → score mapping ──────────────────────────────────────────────────────
LABEL_TO_SCORE = {1: 22, 2: 58, 3: 88}
LABEL_TO_STR   = {1: "unsafe", 2: "caution", 3: "safe"}

FEATURE_COLUMNS = [
    "hour_of_day", "day_of_week", "is_weekend", "is_night",
    "location_type", "route_road_type", "incident_count_7d", "incident_count_30d",
    "lighting_score", "crowd_density",
]


def predict(features: dict) -> dict:
    """
    Predict safety for a single feature vector.

    Args:
        features: dict with keys matching FEATURE_COLUMNS

    Returns:
        dict with keys: score (int 0–100), label (str), probabilities (list)
    """
    clf = _load_model()

    row   = pd.DataFrame([{col: features[col] for col in FEATURE_COLUMNS}])
    label = int(clf.predict(row)[0])
    probs = clf.predict_proba(row)[0].tolist()  # [p_unsafe, p_caution, p_safe]

    # Continuous probability-weighted score: 15–95 range
    # Gives real spread between routes instead of snapping to 3 fixed bands
    p_unsafe, p_caution, p_safe = probs
    score = int(round(p_unsafe * 15 + p_caution * 60 + p_safe * 95))
    score = max(10, min(99, score))  # clamp to [10, 99]

    label_map = {1: "unsafe", 2: "caution", 3: "safe"}

    return {
        "score": score,
        "label": label_map[label],
        "probabilities": {
            "unsafe":  round(p_unsafe,  3),
            "caution": round(p_caution, 3),
            "safe":    round(p_safe,    3),
        },
    }
