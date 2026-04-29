"""
features.py — Extracts and assembles the model's feature vector from raw API input.
Uses static lookup tables for the prototype; replace with real sensor/map data in production.
"""

from datetime import datetime, timezone
from typing import Optional


# ── Static lookup tables ───────────────────────────────────────────────────────

# location_type codes
LOCATION_TYPE = {
    "residential": 0,
    "commercial":  1,
    "park":        2,
    "underpass":   3,
    "transit":     4,
}

# Lighting score by (location_type_code, is_night)
# 0.0 = completely dark, 1.0 = very well lit
LIGHTING_TABLE = {
    (0, 0): 0.80,  # residential, day
    (0, 1): 0.55,  # residential, night
    (1, 0): 0.90,  # commercial, day
    (1, 1): 0.75,  # commercial, night
    (2, 0): 0.70,  # park, day
    (2, 1): 0.25,  # park, night
    (3, 0): 0.40,  # underpass, day
    (3, 1): 0.10,  # underpass, night
    (4, 0): 0.85,  # transit, day
    (4, 1): 0.65,  # transit, night
}

# Crowd density by (location_type_code, hour_bucket)
# hour_bucket: 0 = midnight–6, 1 = 6–12, 2 = 12–18, 3 = 18–24
CROWD_TABLE = {
    (0, 0): 0.05, (0, 1): 0.40, (0, 2): 0.35, (0, 3): 0.50,
    (1, 0): 0.10, (1, 1): 0.70, (1, 2): 0.85, (1, 3): 0.75,
    (2, 0): 0.02, (2, 1): 0.55, (2, 2): 0.60, (2, 3): 0.40,
    (3, 0): 0.02, (3, 1): 0.30, (3, 2): 0.35, (3, 3): 0.20,
    (4, 0): 0.15, (4, 1): 0.80, (4, 2): 0.75, (4, 3): 0.65,
}

# Rough coordinate grid → location type (lat rounded to 3 dp)
# Hyderabad prototype zones
COORD_ZONE_MAP = {
    (17.444, 78.377): "commercial",   # Hitech City
    (17.437, 78.382): "transit",      # Metro Station
    (17.431, 78.385): "residential",  # Madhapur
    (17.450, 78.370): "park",         # Durgam Cheruvu
    (17.420, 78.390): "underpass",    # underpass near DLF
}


# ── Helper functions ───────────────────────────────────────────────────────────

def _hour_bucket(hour: int) -> int:
    if hour < 6:   return 0
    if hour < 12:  return 1
    if hour < 18:  return 2
    return 3


def _infer_location_type(lat: float, lng: float) -> int:
    """Snap coordinates to nearest known zone, default to residential."""
    best_match = "residential"
    best_dist  = float("inf")
    for (z_lat, z_lng), loc_type in COORD_ZONE_MAP.items():
        dist = abs(lat - z_lat) + abs(lng - z_lng)
        if dist < best_dist:
            best_dist  = dist
            best_match = loc_type
    return LOCATION_TYPE.get(best_match, 0)


def build_feature_vector(
    lat: float,
    lng: float,
    hour_of_day: int,
    day_of_week: int,
    incident_count_7d: int  = 0,
    incident_count_30d: int = 0,
) -> dict:
    """
    Assemble the full feature dict for a single coordinate + time.
    This dict is passed directly to model.predict().
    """
    is_night      = 1 if (hour_of_day >= 20 or hour_of_day < 5) else 0
    is_weekend    = 1 if day_of_week >= 5 else 0
    loc_type      = _infer_location_type(lat, lng)
    lighting      = LIGHTING_TABLE.get((loc_type, is_night), 0.6)
    crowd         = CROWD_TABLE.get((loc_type, _hour_bucket(hour_of_day)), 0.5)

    return {
        "hour_of_day":        hour_of_day,
        "day_of_week":        day_of_week,
        "is_weekend":         is_weekend,
        "is_night":           is_night,
        "location_type":      loc_type,
        "incident_count_7d":  incident_count_7d,
        "incident_count_30d": incident_count_30d,
        "lighting_score":     lighting,
        "crowd_density":      crowd,
        # Expose breakdown for API response
        "_lighting":          lighting,
        "_crowd":             crowd,
        "_incident_density":  incident_count_7d,
    }


def resolve_time_offset(time_option: str) -> datetime:
    """Convert report time string to an absolute UTC timestamp."""
    now = datetime.now(timezone.utc)
    
    if time_option == "now":
        return now
    elif time_option == "earlier today":
        # Current date at 12:00 UTC
        return now.replace(hour=12, minute=0, second=0, microsecond=0)
    elif time_option == "this week":
        # 3 days ago
        return now - timedelta(days=3)
    
    return now
