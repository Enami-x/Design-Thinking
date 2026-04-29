"""
safety.py — POST /predict-score endpoint.
Takes route waypoints + travel time, runs the ML model, returns a safety score.
"""

from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.ml import model as ml
from app.utils.features import build_feature_vector

router = APIRouter(prefix="/safety", tags=["safety"])


# ── Request / Response schemas ─────────────────────────────────────────────────

class Coordinate(BaseModel):
    lat: float
    lng: float


class PredictRequest(BaseModel):
    coordinates: List[Coordinate] = Field(..., min_length=1)
    hour_of_day: int = Field(..., ge=0, le=23)
    day_of_week: int = Field(..., ge=0, le=6)
    incident_count_7d:  int = Field(default=0, ge=0)
    incident_count_30d: int = Field(default=0, ge=0)


class BreakdownSchema(BaseModel):
    lighting:         float
    crowd:            float
    incident_density: int


class PredictResponse(BaseModel):
    safety_score: int
    label:        str
    breakdown:    BreakdownSchema


# ── Route ─────────────────────────────────────────────────────────────────────

@router.post("/predict-score", response_model=PredictResponse)
def predict_score(body: PredictRequest):
    scores      = []
    lightings   = []
    crowds      = []

    for coord in body.coordinates:
        features = build_feature_vector(
            lat=coord.lat,
            lng=coord.lng,
            hour_of_day=body.hour_of_day,
            day_of_week=body.day_of_week,
            incident_count_7d=body.incident_count_7d,
            incident_count_30d=body.incident_count_30d,
        )
        result = ml.predict(features)
        scores.append(result["score"])
        lightings.append(features["_lighting"])
        crowds.append(features["_crowd"])

    avg_score = int(sum(scores) / len(scores))
    label = (
        "safe"    if avg_score >= 75 else
        "caution" if avg_score >= 45 else
        "unsafe"
    )

    return PredictResponse(
        safety_score=avg_score,
        label=label,
        breakdown=BreakdownSchema(
            lighting=round(sum(lightings) / len(lightings), 2),
            crowd=round(sum(crowds) / len(crowds), 2),
            incident_density=body.incident_count_7d,
        ),
    )
