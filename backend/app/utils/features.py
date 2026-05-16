"""
features.py — Extracts and assembles the model's feature vector from raw API input.

Improvements over the prototype:
  1. ORS waytype codes → location type (replaces the 5-point fake coordinate grid)
  2. Real sunrise/sunset via `astral` (replaces hardcoded 20:00 cutoff)
  3. Incident counts weighted more heavily so crowdsourced reports dominate
"""

from datetime import date, datetime, timezone
from typing import Optional

from astral import LocationInfo
from astral.sun import sun


# ── ORS waytype → location_type mapping ───────────────────────────────────────
# ORS waytype codes (from the extra_info["waytypes"] response):
#   0  Unknown
#   1  State Road      → commercial (well-lit main road)
#   2  Road            → commercial
#   3  Street          → residential (neighbourhood road)
#   4  Path            → park (dim, isolated)
#   5  Track           → park
#   6  Cycleway        → residential
#   7  Footway         → park (pedestrian alley/lane)
#   8  Steps           → underpass (isolated, unlit)
#   9  Ferry           → transit
#  10  Construction    → underpass (treat as risky)

ORS_WAYTYPE_TO_LOCATION = {
    0: "residential",   # unknown → default safe assumption
    1: "commercial",    # state road — wide, lit, busy
    2: "commercial",    # road
    3: "residential",   # street / neighbourhood
    4: "park",          # path — can be unlit
    5: "park",          # track
    6: "residential",   # cycleway
    7: "park",          # footway / pedestrian alley
    8: "underpass",     # steps — isolated
    9: "transit",       # ferry
    10: "underpass",    # construction — treat as risky
}

# location_type codes (must match train.py)
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
    (1, 0): 0.95,  # commercial/main road, day   ← boosted: street lights all along
    (1, 1): 0.85,  # commercial/main road, night ← boosted: main roads are lit
    (2, 0): 0.70,  # park, day
    (2, 1): 0.25,  # park, night
    (3, 0): 0.40,  # underpass, day
    (3, 1): 0.10,  # underpass, night
    (4, 0): 0.88,  # transit, day
    (4, 1): 0.72,  # transit, night
}

# Crowd density by (location_type_code, hour_bucket)
# hour_bucket: 0 = midnight–6, 1 = 6–12, 2 = 12–18, 3 = 18–24
CROWD_TABLE = {
    (0, 0): 0.05, (0, 1): 0.40, (0, 2): 0.35, (0, 3): 0.50,
    (1, 0): 0.30, (1, 1): 0.80, (1, 2): 0.90, (1, 3): 0.85,  # ← main roads always busier
    (2, 0): 0.02, (2, 1): 0.55, (2, 2): 0.60, (2, 3): 0.40,
    (3, 0): 0.02, (3, 1): 0.30, (3, 2): 0.35, (3, 3): 0.20,
    (4, 0): 0.20, (4, 1): 0.85, (4, 2): 0.80, (4, 3): 0.70,
}


# ── Helper functions ───────────────────────────────────────────────────────────

def _hour_bucket(hour: int) -> int:
    if hour < 6:   return 0
    if hour < 12:  return 1
    if hour < 18:  return 2
    return 3


def _is_night(lat: float, lng: float, hour: int) -> int:
    """
    Returns 1 if it is astronomically night at the given location and hour,
    using real sunrise/sunset times computed by the `astral` library.
    Falls back to the old 20:00 cutoff if astral fails for any reason.
    """
    try:
        loc = LocationInfo(latitude=lat, longitude=lng)
        today = date.today()
        s = sun(loc.observer, date=today, tzinfo=timezone.utc)
        sunrise_hour = s["sunrise"].hour
        sunset_hour  = s["sunset"].hour
        return 1 if (hour < sunrise_hour or hour >= sunset_hour) else 0
    except Exception:
        # Graceful fallback
        return 1 if (hour >= 20 or hour < 5) else 0


def _waytype_to_loc_type(waytype: int) -> int:
    """Map an ORS waytype code to our internal location_type int."""
    name = ORS_WAYTYPE_TO_LOCATION.get(waytype, "residential")
    return LOCATION_TYPE.get(name, 0)


# ── Main builder ───────────────────────────────────────────────────────────────

def build_feature_vector(
    lat: float,
    lng: float,
    hour_of_day: int,
    day_of_week: int,
    incident_count_7d:  int = 0,
    incident_count_30d: int = 0,
    route_road_type:    int = -1,   # ORS waytype code; -1 = unknown
) -> dict:
    """
    Assemble the full feature dict for a single coordinate + time.

    route_road_type: ORS waytype integer from extra_info["waytypes"].
      Pass -1 (default) when unknown; the function will then default to
      residential, which is a safe middle-ground assumption.
    """
    is_night   = _is_night(lat, lng, hour_of_day)
    is_weekend = 1 if day_of_week >= 5 else 0

    # Use ORS waytype if provided, else default to residential
    if route_road_type >= 0:
        loc_type = _waytype_to_loc_type(route_road_type)
    else:
        loc_type = LOCATION_TYPE["residential"]

    lighting = LIGHTING_TABLE.get((loc_type, is_night), 0.6)
    crowd    = CROWD_TABLE.get((loc_type, _hour_bucket(hour_of_day)), 0.5)

    return {
        "hour_of_day":        hour_of_day,
        "day_of_week":        day_of_week,
        "is_weekend":         is_weekend,
        "is_night":           is_night,
        "location_type":      loc_type,
        "route_road_type":    max(route_road_type, 0),  # store 0 when unknown (-1)
        "incident_count_7d":  incident_count_7d,
        "incident_count_30d": incident_count_30d,
        "lighting_score":     lighting,
        "crowd_density":      crowd,
        # Internal fields for breakdown response
        "_lighting":          lighting,
        "_crowd":             crowd,
        "_incident_density":  incident_count_7d,
    }


def resolve_time_offset(time_option: str) -> datetime:
    """Convert report time string to an absolute UTC timestamp."""
    from datetime import timedelta
    now = datetime.now(timezone.utc)

    if time_option == "now":
        return now
    elif time_option == "earlier today":
        return now.replace(hour=12, minute=0, second=0, microsecond=0)
    elif time_option == "this week":
        return now - timedelta(days=3)

    return now
