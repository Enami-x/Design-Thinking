# SafeWalk

SafeWalk is a high-fidelity, interactive mobile app prototype designed for women's safety during solo travel. It features a dark-themed, empowering, and premium UI with a focus on quick access to safety features.

It is structured as a monorepo containing a React Native frontend and a FastAPI backend.

## How to run the frontend
```bash
cd frontend
npx expo start
```

## How to run the backend
```bash
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
> **Mobile devices:** The `--host 0.0.0.0` flag is required so your Android/iOS device can reach the server over Wi-Fi.
> Update `frontend/services/api.js` → `BASE_URL` to your machine's local IP (run `ipconfig` to find it).

## Features

* **Interactive Map**: View safe zones, caution areas, and dangerous regions using a color-coded heatmap.
* **Route Detail**: Get a breakdown of route safety (lighting, crowd, incidents) and share your route with trusted contacts.
* **Incident Reporting**: Quickly report suspicious activities, harassment, poor lighting, or unsafe roads. Supports anonymous reporting.
* **Nearby Alerts**: Stay informed with upvoted community alerts regarding safety hazards nearby.
* **SOS & Journey Tracking**: Share your live location with trusted contacts and access a prominent SOS button that sends an immediate alert.

## Tech Stack

### Frontend
* **Framework**: React Native (Expo)
* **Navigation**: Expo Router (File-based routing)
* **Styling**: React Native StyleSheet (Custom Design System with dark theme and premium aesthetics)
* **Mapping**: Leaflet (via `react-leaflet` or standard Leaflet for web fallback)
* **Animations**: React Native Animated API

### Backend
* **Framework**: FastAPI
* **Machine Learning**: scikit-learn, pandas, numpy

## License

This project is licensed under the MIT License.
