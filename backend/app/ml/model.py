"""
model.py — Loads the trained Random Forest model and exposes a predict() function.
The model is loaded once at import time (singleton pattern).
"""

import os
import joblib
import numpy as np

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
    "location_type", "incident_count_7d", "incident_count_30d",
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

    row = np.array([[features[col] for col in FEATURE_COLUMNS]], dtype=float)
    label    = int(clf.predict(row)[0])
    probs    = clf.predict_proba(row)[0].tolist()

    return {
        "score": LABEL_TO_SCORE[label],
        "label": LABEL_TO_STR[label],
        "probabilities": {
            "unsafe":  round(probs[0], 3),
            "caution": round(probs[1], 3),
            "safe":    round(probs[2], 3),
        },
    }
