"""
incidents.py — POST /report and GET /incidents endpoints.
Reads/writes incident data to/from Supabase.
"""

import math
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel, Field

from app.db import get_db
from app.utils.features import resolve_time_offset

router = APIRouter(prefix="/incidents", tags=["incidents"])


# ── Severity derivation ────────────────────────────────────────────────────────
SEVERITY_MAP = {
    "harassment":    "high",
    "suspicious":    "medium",
    "poor-lighting": "low",
    "road":          "low",
    "other":         "low",
}

TITLE_MAP = {
    "harassment":    "Harassment reported",
    "suspicious":    "Suspicious activity",
    "poor-lighting": "Poor lighting",
    "road":          "Unsafe road / footpath",
    "other":         "Incident reported",
}


# ── Schemas ────────────────────────────────────────────────────────────────────

class ReportRequest(BaseModel):
    lat:         float
    lng:         float
    type:        str = Field(..., pattern="^(harassment|suspicious|poor-lighting|road|other)$")
    time_of_day: str = Field(default="now", pattern="^(now|earlier today|this week)$")
    anonymous:   bool = True


class ReportResponse(BaseModel):
    status:  str = "success"
    message: str = "Report submitted"
    id:      str


class IncidentOut(BaseModel):
    id:           str
    lat:          float
    lng:          float
    type:         str
    severity:     str
    distance_km:  float
    occurred_at:  str
    upvotes:      int


class IncidentsResponse(BaseModel):
    incidents: List[IncidentOut]


# ── Helpers ────────────────────────────────────────────────────────────────────

def _haversine(lat1, lng1, lat2, lng2) -> float:
    """Return distance in km between two lat/lng points."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _time_ago(occurred_at_str: str) -> str:
    try:
        dt = datetime.fromisoformat(occurred_at_str.replace("Z", "+00:00"))
        diff = datetime.now(timezone.utc) - dt
        minutes = int(diff.total_seconds() / 60)
        if minutes < 60:    return f"{minutes}m ago"
        if minutes < 1440:  return f"{minutes // 60}h ago"
        return f"{minutes // 1440}d ago"
    except Exception:
        return "recently"


# ── Routes ─────────────────────────────────────────────────────────────────────

@router.post("/report", response_model=ReportResponse, status_code=201)
def report_incident(body: ReportRequest):
    db = get_db()

    occurred_at = resolve_time_offset(body.time_of_day)
    row = {
        "id":          str(uuid.uuid4()),
        "lat":         body.lat,
        "lng":         body.lng,
        "type":        body.type,
        "severity":    SEVERITY_MAP.get(body.type, "low"),
        "anonymous":   body.anonymous,
        "occurred_at": occurred_at.isoformat(),
        "upvotes":     0,
    }

    result = db.table("incidents").insert(row).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to save incident")

    return ReportResponse(id=row["id"])


@router.get("/incidents", response_model=IncidentsResponse)
def get_incidents(
    lat:       float = Query(...),
    lng:       float = Query(...),
    radius_km: float = Query(default=2.0, ge=0.1, le=20.0),
):
    db = get_db()

    # Filter for incidents within the last 7 days
    last_week = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()

    # Rough bounding box filter (1 degree ≈ 111 km)
    delta = radius_km / 111.0
    result = db.table("incidents")\
        .select("*")\
        .gte("lat", lat - delta)\
        .lte("lat", lat + delta)\
        .gte("lng", lng - delta)\
        .lte("lng", lng + delta)\
        .gte("occurred_at", last_week)\
        .order("occurred_at", desc=True)\
        .limit(50)\
        .execute()

    rows = result.data or []
    incidents = []

    for row in rows:
        dist = _haversine(lat, lng, row["lat"], row["lng"])
        if dist > radius_km:
            continue  # precise radius filter

        incidents.append(IncidentOut(
            id          = row["id"],
            lat         = row["lat"],
            lng         = row["lng"],
            type        = row["type"],
            severity    = row.get("severity", "low"),
            distance_km = round(dist, 2),
            occurred_at = row.get("occurred_at", ""),
            upvotes     = row.get("upvotes", 0),
        ))

    incidents.sort(key=lambda x: x.distance_km)
    return IncidentsResponse(incidents=incidents)
