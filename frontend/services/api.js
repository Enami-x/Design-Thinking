import Constants from 'expo-constants';

/**
 * api.js — Centralized service for communicating with the FastAPI backend.
 */

// If you are using a physical device, replace 'localhost' with your machine's IP address.
// For example: 'http://192.168.1.10:8000'
const BASE_URL = 'http://10.100.4.225:8000';

export const API = {
  /**
   * Fetch safety score for a route.
   */
  async predictScore(coordinates) {
    try {
      const now = new Date();
      const payload = {
        coordinates,
        hour_of_day: now.getHours(),
        day_of_week: (now.getDay() + 6) % 7, // Monday = 0
        incident_count_7d: 0,
        incident_count_30d: 0,
      };

      const res = await fetch(`${BASE_URL}/safety/predict-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('API Error');
      return await res.json();
    } catch (err) {
      console.warn('API Predict Error:', err);
      return null;
    }
  },

  /**
   * Submit a new incident report.
   */
  async reportIncident(data) {
    try {
      const res = await fetch(`${BASE_URL}/incidents/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('API Error');
      return await res.json();
    } catch (err) {
      console.error('API Report Error:', err);
      throw err;
    }
  },

  /**
   * Fetch nearby alerts.
   */
  async getIncidents(lat, lng, radiusKm = 2.0) {
    try {
      const res = await fetch(
        `${BASE_URL}/incidents/incidents?lat=${lat}&lng=${lng}&radius_km=${radiusKm}`
      );
      if (!res.ok) throw new Error('API Error');
      const data = await res.json();
      return data.incidents;
    } catch (err) {
      console.warn('API Get Incidents Error:', err);
      return null;
    }
  },
};
