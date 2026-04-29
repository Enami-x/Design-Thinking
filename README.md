# 🛡️ SafeWalk

SafeWalk is a high-fidelity, interactive mobile app designed to enhance women's safety during solo travel and daily commutes. It features a dark-themed, empowering, and premium user interface with a primary focus on quick access to crucial safety features.

Built as a full-stack monorepo, SafeWalk integrates a robust **React Native (Expo)** frontend with an AI-powered **FastAPI** backend that calculates safety scores and aggregates incident reports in real-time.

---

## ✨ Features

- **🗺️ Interactive Map Heatmap:** View safe zones, caution areas, and dangerous regions using a dynamic color-coded heatmap based on historical incident data.
- **🛣️ Route Safety Analysis:** Get a breakdown of route safety (lighting, crowd levels, past incidents) and share your active route with trusted contacts.
- **🚨 Incident Reporting:** Quickly and anonymously report suspicious activities, harassment, poor lighting, or unsafe roads to warn others.
- **🔔 Nearby Alerts:** Stay informed with upvoted community alerts regarding active safety hazards nearby.
- **🆘 SOS & Journey Tracking:** Share your live location with trusted contacts and access a prominent SOS button that immediately sends alerts to your emergency circle.
- **🤖 AI-Powered Risk Scoring:** The backend utilizes Machine Learning to predict location-based risk factors and suggest the safest possible path.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React Native (Expo)
- **Navigation:** Expo Router (File-based routing)
- **Styling:** React Native StyleSheet (Custom Design System with a premium dark theme aesthetic)
- **Mapping:** Leaflet & React Native Maps
- **Animations:** React Native Animated API & Reanimated

### Backend
- **Framework:** FastAPI (Python)
- **Machine Learning:** Scikit-Learn, Pandas, NumPy
- **Server:** Uvicorn

---

## 📂 Project Structure

```text
safewalk/
├── backend/          # FastAPI Python server and Machine Learning models
│   ├── app/          # API routes, utilities, and ML inference code
│   ├── data/         # CSV datasets for incidents and safety features
│   └── requirements.txt
└── frontend/         # React Native Expo application
    ├── app/          # Screens and layout (Expo Router)
    ├── components/   # Reusable UI components
    ├── services/     # API integration logic
    └── store/        # State management
```

---

## 🚀 Getting Started

Follow these steps to set up the project on your local machine.

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or newer)
- [Python](https://www.python.org/) (3.9 or newer)
- **Expo Go** app installed on your physical iOS or Android device (for mobile testing).

### 1. Setting up the Backend

The backend provides the API endpoints and safety machine learning models.

```bash
# Navigate to the backend directory
cd backend

# (Optional but recommended) Create and activate a virtual environment
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
*Note: The `--host 0.0.0.0` flag is required so your mobile device can access the local server over your Wi-Fi network.*

**API Documentation:** Once the backend is running, you can view the interactive API documentation at `http://localhost:8000/docs`.

### 2. Setting up the Frontend

The frontend is the mobile application built with Expo.

First, you need to point the frontend to your backend server.
1. Find your computer's local IP address (run `ipconfig` on Windows or `ifconfig` on Mac/Linux).
2. Open `frontend/services/api.js` and update the `BASE_URL` to match your local IP address:
   ```javascript
   // Example:
   const BASE_URL = 'http://192.168.1.5:8000';
   ```

Now, run the app:
```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the Expo development server
npx expo start
```

### 3. Running on a Device

- **Physical Device:** Open the **Expo Go** app on your phone and scan the QR code displayed in your terminal. *(Ensure both your phone and computer are on the same Wi-Fi network).*
- **Emulator/Simulator:** Press `a` in the terminal to open in the Android Emulator, or `i` to open in the iOS Simulator.

---

## 🤝 Contributing

Contributions are welcome! Please fork this repository and submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
