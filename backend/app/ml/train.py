"""
train.py — Generates synthetic training data and trains the SafeWalk Random Forest model.
Run this script once from the backend/ directory:  python -m app.ml.train
"""

import os
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

# ── Constants ──────────────────────────────────────────────────────────────────
LOCATION_TYPES = {0: "residential", 1: "commercial", 2: "park", 3: "underpass", 4: "transit"}
N_SAMPLES      = 6000
MODEL_PATH     = os.path.join(os.path.dirname(__file__), "model.pkl")
CSV_PATH       = os.path.join(os.path.dirname(__file__), "..", "..", "data", "incidents.csv")

# ── Synthetic data generation ──────────────────────────────────────────────────
def generate_data(n: int = N_SAMPLES) -> pd.DataFrame:
    rng = np.random.default_rng(42)

    hour         = rng.integers(0, 24, n)
    day_of_week  = rng.integers(0, 7, n)
    location     = rng.integers(0, 5, n)
    inc_7d       = rng.integers(0, 20, n)
    inc_30d      = inc_7d + rng.integers(0, 15, n)
    lighting     = rng.uniform(0, 1, n)
    crowd        = rng.uniform(0, 1, n)

    is_night   = ((hour >= 20) | (hour < 5)).astype(int)
    is_weekend = (day_of_week >= 5).astype(int)

    # Derived lighting: underpass at night is always dark
    lighting = np.where((location == 3) & (is_night == 1), lighting * 0.3, lighting)

    # ── Rule-based label generation ────────────────────────────────────────────
    # Higher score → more likely unsafe
    risk = (
        is_night * 2.0
        + is_weekend * 0.5
        + (location == 3) * 2.0       # underpass
        + (location == 2) * 1.0       # park at night
        + (inc_7d / 5.0)
        + (1 - lighting) * 1.5
        + (1 - crowd) * 0.5           # empty streets are riskier
        + rng.normal(0, 0.5, n)       # noise
    )

    labels = np.where(risk < 2.5, 3,   # safe
              np.where(risk < 4.5, 2,  # caution
                                   1)) # unsafe

    df = pd.DataFrame({
        "hour_of_day":      hour,
        "day_of_week":      day_of_week,
        "is_weekend":       is_weekend,
        "is_night":         is_night,
        "location_type":    location,
        "incident_count_7d":  inc_7d,
        "incident_count_30d": inc_30d,
        "lighting_score":   np.round(lighting, 4),
        "crowd_density":    np.round(crowd, 4),
        "safety_label":     labels,
    })
    return df


# ── Training ───────────────────────────────────────────────────────────────────
def train():
    print("Generating synthetic dataset...")
    df = generate_data()

    # Save CSV for reference
    os.makedirs(os.path.dirname(CSV_PATH), exist_ok=True)
    df.to_csv(CSV_PATH, index=False)
    print(f"  Saved {len(df)} rows -> {CSV_PATH}")

    X = df.drop(columns=["safety_label"])
    y = df["safety_label"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("\nTraining Random Forest...")
    clf = RandomForestClassifier(
        n_estimators=120,
        max_depth=12,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    clf.fit(X_train, y_train)

    y_pred = clf.predict(X_test)
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["unsafe", "caution", "safe"]))

    os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
    joblib.dump(clf, MODEL_PATH)
    print(f"\nModel saved -> {MODEL_PATH}")


if __name__ == "__main__":
    train()
