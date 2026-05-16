from app.utils.features import build_feature_vector
from app.ml import model as ml

tests = [
    ("Main road, noon",     22, 1, 0, 1),
    ("Main road, midnight",  0, 1, 0, 1),
    ("Residential, noon",   14, 1, 0, 3),
    ("Footway, midnight",    0, 1, 0, 7),
    ("Footway+incidents",    0, 1, 8, 7),
]
for name, hour, dow, inc, waytype in tests:
    f = build_feature_vector(17.44, 78.37, hour, dow, incident_count_7d=inc, route_road_type=waytype)
    r = ml.predict(f)
    print(name.ljust(30), "->", str(r["score"]).rjust(3) + "%  (" + r["label"] + ")")
