import requests
import json

ORS_API_KEY = "eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjU2YWM0NDI4ZmI2MTQ5NDZiMGE4ZGZhZDYwMDhjYmIxIiwiaCI6Im11cm11cjY0In0="

url = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson"
headers = {"Authorization": f"Bearer {ORS_API_KEY}", "Content-Type": "application/json"}
body = {
    "coordinates": [[78.3772, 17.4435], [78.3800, 17.4450]],
    "alternative_routes": {"target_count": 2, "weight_factor": 1.4}
}
res = requests.post(url, headers=headers, json=body)
data = res.json()
print("Number of features:", len(data.get("features", [])))
