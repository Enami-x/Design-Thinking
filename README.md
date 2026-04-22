# SafeWalk

SafeWalk is a high-fidelity, interactive mobile app prototype designed for women's safety during solo travel. It features a dark-themed, empowering, and premium UI with a focus on quick access to safety features.

## Features

* **Interactive Map**: View safe zones, caution areas, and dangerous regions using a color-coded heatmap.
* **Route Detail**: Get a breakdown of route safety (lighting, crowd, incidents) and share your route with trusted contacts.
* **Incident Reporting**: Quickly report suspicious activities, harassment, poor lighting, or unsafe roads. Supports anonymous reporting.
* **Nearby Alerts**: Stay informed with upvoted community alerts regarding safety hazards nearby.
* **SOS & Journey Tracking**: Share your live location with trusted contacts and access a prominent SOS button that sends an immediate alert.

## Tech Stack

* **Framework**: React Native (Expo)
* **Navigation**: Expo Router (File-based routing)
* **Styling**: React Native StyleSheet (Custom Design System with dark theme and premium aesthetics)
* **Mapping**: Leaflet (via `react-leaflet` or standard Leaflet for web fallback)
* **Animations**: React Native Animated API

## Getting Started

### Prerequisites

* Node.js installed
* Expo CLI (`npm install -g expo-cli`)

### Installation

1. Clone the repository and navigate to the project folder:
   ```bash
   cd safewalk
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

### Running on Devices

* **Web**: Press `w` in the terminal to open the app in a web browser. The map feature is optimized for web viewing.
* **iOS / Android**: Use the Expo Go app on your physical device to scan the QR code provided in the terminal.

## Design System

The app employs a custom design system defined in `constants/theme.js`. It leverages a deep dark palette with vibrant accent colors to ensure high contrast and readability.
* **Primary Accent**: Teal (`#00d4b0`)
* **Safe Status**: Green (`#10d97e`)
* **Caution Status**: Amber (`#f5a623`)
* **Danger/SOS Status**: Red (`#ff3b5c`)

## License

This project is licensed under the MIT License.
