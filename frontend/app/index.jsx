import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated, Platform, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { HEATMAP_REGIONS } from '../data/mockData';
import { C } from '../constants/theme';
import { ORS_API_KEY } from '../constants/config';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { API } from '../services/api';
import { setRouteStore } from '../store/routeStore';

const HEATMAP_COLORS = { safe: '#10d97e', caution: '#f5a623', danger: '#ff3b5c' };
const DEFAULT_CENTER = [17.4435, 78.3772];

// ─── Nominatim geocode ────────────────────────────────────────────────────────
async function geocode(query) {
  // 1. Detect raw coordinate input: "17.3850 78.4867" or "17.3850,78.4867"
  const coordMatch = query.match(/^\s*(-?\d+\.?\d*)\s*[,\s]\s*(-?\d+\.?\d*)\s*$/);
  if (coordMatch) {
    const lat = parseFloat(coordMatch[1]);
    const lng = parseFloat(coordMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng, name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
    }
  }

  // Required by Nominatim ToS — without this, requests get rejected
  const HEADERS = {
    'Accept-Language': 'en',
    'User-Agent': 'SafeWalk-App/1.0 (student-project)',
  };

  // 2. Try with India bias first (faster, more relevant for Indian users)
  const indiaUrl =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(query)}` +
    `&format=json&limit=3&countrycodes=in&addressdetails=0`;

  const indiaRes  = await fetch(indiaUrl, { headers: HEADERS });
  const indiaData = await indiaRes.json();

  if (indiaData.length > 0) {
    const r = indiaData[0];
    // Short readable name: first two comma-separated parts
    const name = r.display_name.split(',').slice(0, 2).join(',').trim();
    return { lat: parseFloat(r.lat), lng: parseFloat(r.lon), name };
  }

  // 3. Fallback: global search (for coordinates typed as a place name, etc.)
  const globalUrl =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(query)}` +
    `&format=json&limit=1&addressdetails=0`;

  const globalRes  = await fetch(globalUrl, { headers: HEADERS });
  const globalData = await globalRes.json();

  if (globalData.length === 0) throw new Error('Location not found');

  const r = globalData[0];
  const name = r.display_name.split(',').slice(0, 2).join(',').trim();
  return { lat: parseFloat(r.lat), lng: parseFloat(r.lon), name };
}

// ─── ORS route ────────────────────────────────────────────────────────────────
async function fetchOrsRoute(from, to) {
  const url = 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ORS_API_KEY}`,
    },
    body: JSON.stringify({
      coordinates: [[from.lng, from.lat], [to.lng, to.lat]],
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`ORS error ${res.status}: ${errText}`);
  }
  const data = await res.json();
  // GeoJSON response: features[0].geometry.coordinates = [[lng,lat], ...]
  const feature = data.features[0];
  const rawCoords = feature.geometry.coordinates; // [lng, lat] pairs
  const coords = rawCoords.map(([lng, lat]) => [lat, lng]); // convert to [lat, lng] for Leaflet
  const props = feature.properties.summary;
  const distKm = (props.distance / 1000).toFixed(1);
  const timeMins = Math.round(props.duration / 60);
  return { coords, distKm, timeMins };
}

// ─── Map HTML generator (used for mobile WebView) ────────────────────────────
function buildMapHtml({ userLocation, destination, safestCoords, fastestCoords, activeRoute, heatmapRegions }) {
  const center = userLocation || [17.4435, 78.3772];
  return `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; background: #080c10; }
          #map { width: 100vw; height: 100vh; }
          .marker { width:14px; height:14px; border-radius:50%; background:#00d4b0; border:2.5px solid white; box-shadow:0 0 12px rgba(0,212,176,0.9); }
          .dest-marker { width:20px; height:20px; border-radius:50%; background:#ff3b5c; border:3px solid white; box-shadow:0 0 14px rgba(255,59,92,0.8); }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', { zoomControl: false }).setView(${JSON.stringify(center)}, 14);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

          // Heatmap regions
          const regions = ${JSON.stringify(heatmapRegions)};
          const colors = ${JSON.stringify(HEATMAP_COLORS)};
          regions.forEach(r => {
            const col = colors[r.type];
            L.circle([r.lat, r.lng], { radius: r.radius, color: col, fillColor: col, fillOpacity: 0.18, weight: 1 }).addTo(map);
          });

          // User location dot
          const userIcon = L.divIcon({ html: '<div class="marker"></div>', className: '', iconSize: [14, 14], iconAnchor: [7, 7] });
          L.marker(${JSON.stringify(center)}, { icon: userIcon }).addTo(map);

          // Routes
          const safestCoords = ${JSON.stringify(safestCoords)};
          const fastestCoords = ${JSON.stringify(fastestCoords)};
          const active = ${JSON.stringify(activeRoute)};

          if (safestCoords.length > 0) {
            const safestLine = L.polyline(safestCoords, {
              color: active === 'safest' ? '#00d4b0' : 'rgba(0,212,176,0.3)',
              weight: active === 'safest' ? 5 : 3, opacity: 0.9
            }).addTo(map);
            if (active === 'safest') map.fitBounds(safestLine.getBounds(), { padding: [40, 40] });
          }

          if (fastestCoords.length > 0) {
            const fastestLine = L.polyline(fastestCoords, {
              color: active === 'fastest' ? '#f5a623' : 'rgba(245,166,35,0.3)',
              weight: active === 'fastest' ? 5 : 3, opacity: 0.9, dashArray: active === 'fastest' ? '' : '8 6'
            }).addTo(map);
            if (active === 'fastest') map.fitBounds(fastestLine.getBounds(), { padding: [40, 40] });
          }

          // Destination marker
          const destCoords = ${JSON.stringify(destination)};
          if (destCoords) {
            const destIcon = L.divIcon({ html: '<div class="dest-marker"></div>', className: '', iconSize: [20, 20], iconAnchor: [10, 10] });
            L.marker(destCoords, { icon: destIcon }).addTo(map);
          }
        </script>
      </body>
    </html>
  `;
}

// ─── Shared Map Component ────────────────────────────────────────────────────
function SharedMap({ mapState }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const routeLayers = useRef({});

  // Web: initialize once, then update routes imperatively
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let map;
    const init = async () => {
      const L = (await import('leaflet')).default;
      if (!mapRef.current || mapRef.current._leaflet_id) return;

      map = L.map(mapRef.current, { zoomControl: false }).setView(DEFAULT_CENTER, 14);
      leafletMap.current = map;
      routeLayers.current.L = L;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap', subdomains: 'abcd',
      }).addTo(map);

      HEATMAP_REGIONS.forEach(r => {
        const col = HEATMAP_COLORS[r.type];
        L.circle([r.lat, r.lng], {
          radius: r.radius, color: col, fillColor: col, fillOpacity: 0.18, weight: 1,
        }).addTo(map);
      });

      const icon = L.divIcon({
        html: `<div style="width:14px;height:14px;border-radius:50%;background:#00d4b0;border:2.5px solid white;box-shadow:0 0 12px rgba(0,212,176,0.9);"></div>`,
        className: '', iconSize: [14, 14], iconAnchor: [7, 7],
      });
      L.marker(DEFAULT_CENTER, { icon }).addTo(map);
    };
    init();
    return () => { if (map) map.remove(); };
  }, []);

  // Web: reactively update routes when mapState changes
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const map = leafletMap.current;
    const L = routeLayers.current.L;
    if (!map || !L) return;

    // Remove old route lines
    if (routeLayers.current.safestLine) routeLayers.current.safestLine.remove();
    if (routeLayers.current.fastestLine) routeLayers.current.fastestLine.remove();
    if (routeLayers.current.destMarker) routeLayers.current.destMarker.remove();

    const { safestCoords, fastestCoords, activeRoute, destination } = mapState;

    if (safestCoords.length > 0) {
      const active = activeRoute === 'safest';
      routeLayers.current.safestLine = L.polyline(safestCoords, {
        color: active ? '#00d4b0' : 'rgba(0,212,176,0.3)',
        weight: active ? 5 : 3, opacity: 0.9,
      }).addTo(map);
      if (active) map.fitBounds(routeLayers.current.safestLine.getBounds(), { padding: [40, 40] });
    }

    if (fastestCoords.length > 0) {
      const active = activeRoute === 'fastest';
      routeLayers.current.fastestLine = L.polyline(fastestCoords, {
        color: active ? '#f5a623' : 'rgba(245,166,35,0.3)',
        weight: active ? 5 : 3, opacity: 0.9,
        dashArray: active ? '' : '8 6',
      }).addTo(map);
      if (active) map.fitBounds(routeLayers.current.fastestLine.getBounds(), { padding: [40, 40] });
    }

    if (destination) {
      const destIcon = L.divIcon({
        html: `<div style="width:20px;height:20px;border-radius:50%;background:#ff3b5c;border:3px solid white;box-shadow:0 0 14px rgba(255,59,92,0.8);"></div>`,
        className: '', iconSize: [20, 20], iconAnchor: [10, 10],
      });
      routeLayers.current.destMarker = L.marker(destination, { icon: destIcon }).addTo(map);
    }
  }, [mapState]);

  if (Platform.OS === 'web') {
    return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
  }

  // Mobile: rebuild HTML when mapState changes
  const html = buildMapHtml({
    userLocation: mapState.userLocation,
    destination: mapState.destination,
    safestCoords: mapState.safestCoords,
    fastestCoords: mapState.fastestCoords,
    activeRoute: mapState.activeRoute,
    heatmapRegions: HEATMAP_REGIONS,
  });

  return (
    <WebView
      key={JSON.stringify(mapState)} // force re-render when routes change
      originWhitelist={['*']}
      source={{ html }}
      style={{ backgroundColor: '#080c10' }}
    />
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();

  // ── State ────────────────────────────────────────────────────────────────────
  const [userLocation, setUserLocation] = useState(null); // real GPS [lat, lng]
  const [activeRoute, setActiveRoute]   = useState('safest');
  const [search, setSearch]             = useState('');
  const [searching, setSearching]       = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const [searchError, setSearchError]   = useState('');
  const [routeDetailData, setRouteDetailData] = useState(null); // populated after a successful search
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [mapState, setMapState] = useState({
    userLocation: null,
    destination: null,
    safestCoords: [],
    fastestCoords: [],
    activeRoute: 'safest',
  });
  const [scores, setScores] = useState({ safest: null, fastest: null });
  const [routeStats, setRouteStats] = useState({
    safest:  { km: '--', time: '--' },
    fastest: { km: '--', time: '--' },
  });

  // ── On mount: fade in + get real GPS location ─────────────────────────────
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const coords = [loc.coords.latitude, loc.coords.longitude];
        setUserLocation(coords);
        setMapState(prev => ({ ...prev, userLocation: coords }));
      } catch (_) {
        // Permission denied or unavailable — stay on default
      }
    })();
  }, []);

  // Sync activeRoute into mapState so the map redraws
  useEffect(() => {
    setMapState(prev => ({ ...prev, activeRoute }));
  }, [activeRoute]);

  const handleSearch = async () => {
    if (!search.trim()) return;
    setSearching(true);
    setSearchError('');
    try {
      const dest = await geocode(search.trim());
      await buildRoutes(dest);
    } catch (e) {
      setSearchError('Location not found. Try a more specific query.');
    } finally {
      setSearching(false);
    }
  };

  const buildRoutes = async (dest) => {
    setRouteLoading(true);
    // Use real GPS if available, fall back to Hyderabad centre
    const from = mapState.userLocation
      ? { lat: mapState.userLocation[0], lng: mapState.userLocation[1] }
      : { lat: 17.4435, lng: 78.3772 };

    try {
      // Fetch one route from ORS
      const orsRoute = await fetchOrsRoute(from, dest);
      const safestCoords = orsRoute.coords;

      // Simulate "fastest" route
      const fastestCoords = safestCoords.filter((_, i) => i % 3 === 0 || i === safestCoords.length - 1);

      // Score both routes against the backend
      const toPayload = (coords) => coords
        .filter((_, i) => i % Math.max(1, Math.floor(coords.length / 8)) === 0)
        .map(([lat, lng]) => ({ lat, lng }));

      const [safestScore, fastestScore] = await Promise.all([
        API.predictScore(toPayload(safestCoords)),
        API.predictScore(toPayload(fastestCoords)),
      ]);

      const safestFinal = safestScore?.safety_score  ?? 78;
      const fastestFinal = fastestScore?.safety_score ?? 55;

      setMapState(prev => ({
        ...prev,
        destination: [dest.lat, dest.lng],
        safestCoords,
        fastestCoords,
        activeRoute,
      }));

      setRouteStats({
        safest:  { km: `${orsRoute.distKm} km`, time: `${orsRoute.timeMins} min` },
        fastest: { km: `${(orsRoute.distKm * 0.82).toFixed(1)} km`, time: `${Math.round(orsRoute.timeMins * 0.65)} min` },
      });
      setScores({ safest: safestFinal, fastest: fastestFinal });

      // Store for route-detail navigation AND global Journey tab access
      const routeData = {
        destName:        dest.name || `${dest.lat}, ${dest.lng}`,
        destLat:         dest.lat,
        destLng:         dest.lng,
        safestKm:        orsRoute.distKm,
        safestTime:      orsRoute.timeMins,
        fastestKm:       (orsRoute.distKm * 0.82).toFixed(1),
        fastestTime:     Math.round(orsRoute.timeMins * 0.65),
        safestScore:     safestFinal,
        fastestScore:    fastestFinal,
        lighting:        safestScore?.breakdown?.lighting        ?? 0.8,
        crowd:           safestScore?.breakdown?.crowd           ?? 0.5,
        incidentDensity: safestScore?.breakdown?.incident_density ?? 0,
      };
      setRouteDetailData(routeData);
      setRouteStore({
        destLat:     dest.lat,
        destLng:     dest.lng,
        destName:    dest.name || `${dest.lat}, ${dest.lng}`,
        timeMins:    orsRoute.timeMins,
        routeCoords: safestCoords,   // actual road-following polyline [[lat,lng],...]
      });

    } catch (e) {
      console.warn('Route error:', e.message);
      // Fallback: draw a straight line so the UI still responds
      setMapState(prev => ({
        ...prev,
        destination:   [dest.lat, dest.lng],
        safestCoords:  [[from.lat, from.lng], [dest.lat, dest.lng]],
        fastestCoords: [[from.lat, from.lng], [dest.lat, dest.lng]],
        activeRoute,
      }));
      setRouteStats({
        safest:  { km: 'N/A', time: 'N/A' },
        fastest: { km: 'N/A', time: 'N/A' },
      });
      // Still set dest coords so sos.jsx map works
      setRouteDetailData({
        destName:        dest.name || `${dest.lat}, ${dest.lng}`,
        destLat:         dest.lat,
        destLng:         dest.lng,
        safestKm:        'N/A',
        safestTime:      'N/A',
        fastestKm:       'N/A',
        fastestTime:     'N/A',
        safestScore:     78,
        fastestScore:    55,
        lighting:        0.8,
        crowd:           0.5,
        incidentDensity: 0,
      });
      setRouteStore({
        destLat:  dest.lat,
        destLng:  dest.lng,
        destName: dest.name || `${dest.lat}, ${dest.lng}`,
        timeMins: null,
      });
    } finally {
      setRouteLoading(false);
    }
  };

  const cur = {
    km:     routeStats[activeRoute].km,
    time:   routeStats[activeRoute].time,
    safety: scores[activeRoute],
  };
  const safetyCol = !cur.safety
    ? C.textSecondary
    : cur.safety >= 75 ? C.safe : cur.safety >= 45 ? C.caution : C.danger;

  return (
    <View style={s.container}>
      {/* Full-bleed map */}
      <View style={s.mapContainer}>
        <SharedMap mapState={mapState} />
      </View>

      {/* Search bar overlay */}
      <Animated.View style={[s.searchWrap, { opacity: fadeAnim }]}>
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={17} color={C.textSecondary} />
          <TextInput
            style={s.searchInput}
            placeholder="Where are you going?"
            placeholderTextColor={C.textSecondary}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searching || routeLoading ? (
            <ActivityIndicator size="small" color={C.teal} />
          ) : (
            <TouchableOpacity style={s.micBtn} onPress={handleSearch}>
              <Ionicons name="arrow-forward" size={16} color={C.teal} />
            </TouchableOpacity>
          )}
        </View>
        {searchError ? <Text style={s.searchError}>{searchError}</Text> : null}
      </Animated.View>

      {/* Bottom sheet */}
      <View style={s.sheet}>
        <View style={s.handle} />

        {/* Route type toggle */}
        <View style={s.toggle}>
          {[
            { key: 'safest', label: 'Safest Route', icon: 'shield-checkmark' },
            { key: 'fastest', label: 'Fastest Route', icon: 'flash' },
          ].map(({ key, label, icon }) => {
            const active = activeRoute === key;
            return (
              <TouchableOpacity
                key={key}
                style={[s.toggleTab, active && s.toggleTabActive]}
                onPress={() => setActiveRoute(key)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={active ? icon : `${icon}-outline`}
                  size={15}
                  color={active ? C.bg : C.textSecondary}
                />
                <Text style={[s.toggleTabText, active && s.toggleTabTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Ionicons name="walk-outline" size={18} color={C.textSecondary} />
            <Text style={s.statVal}>{cur.km}</Text>
          </View>
          <View style={s.statSep} />
          <View style={s.statItem}>
            <Ionicons name="time-outline" size={18} color={C.textSecondary} />
            <Text style={s.statVal}>{cur.time}</Text>
          </View>
          <View style={s.statSep} />
          <View style={s.statItem}>
            <Ionicons name="shield-checkmark-outline" size={18} color={safetyCol} />
            <Text style={[s.statVal, { color: safetyCol }]}>
              {cur.safety != null ? `${cur.safety}%` : '--'}
            </Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={s.cta}
          onPress={() => {
            const p = routeDetailData || {};
            router.push({
              pathname: '/route-detail',
              params: {
                destName:        p.destName        ?? 'Unknown destination',
                destLat:         p.destLat          ?? '',
                destLng:         p.destLng          ?? '',
                safestKm:        p.safestKm        ?? '--',
                safestTime:      p.safestTime       ?? '--',
                fastestKm:       p.fastestKm        ?? '--',
                fastestTime:     p.fastestTime      ?? '--',
                safestScore:     p.safestScore      ?? 78,
                fastestScore:    p.fastestScore     ?? 55,
                lighting:        p.lighting         ?? 0.8,
                crowd:           p.crowd            ?? 0.5,
                incidentDensity: p.incidentDensity  ?? 0,
                activeRoute,
              },
            });
          }}
          activeOpacity={0.85}
        >
          <Text style={s.ctaText}>View Route Details</Text>
          <Ionicons name="arrow-forward" size={17} color={C.bg} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  mapContainer: { flex: 1 },

  // Search
  searchWrap: { position: 'absolute', top: 56, left: 16, right: 16 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(13,21,32,0.96)',
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 13,
    borderWidth: 1, borderColor: C.borderMd,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 16,
  },
  searchInput: {
    flex: 1, color: C.textPrimary, fontSize: 15, fontWeight: '500',
  },
  micBtn: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: C.tealDim,
    alignItems: 'center', justifyContent: 'center',
  },
  searchError: {
    color: C.danger, fontSize: 12, marginTop: 6, marginLeft: 4,
  },

  // Sheet
  sheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 18,
    borderTopWidth: 1, borderTopColor: C.border,
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.3, shadowRadius: 12,
  },
  handle: {
    width: 36, height: 3.5, borderRadius: 2,
    backgroundColor: C.surface3, alignSelf: 'center', marginBottom: 20,
  },

  // Toggle
  toggle: {
    flexDirection: 'row', backgroundColor: C.surface2,
    borderRadius: 14, padding: 4, marginBottom: 18,
    borderWidth: 1, borderColor: C.border,
  },
  toggleTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 7,
    paddingVertical: 11, borderRadius: 11,
  },
  toggleTabActive: { backgroundColor: C.teal },
  toggleTabText: { color: C.textSecondary, fontSize: 13, fontWeight: '600' },
  toggleTabTextActive: { color: C.bg, fontWeight: '700' },

  // Stats
  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.surface2,
    borderRadius: 16, paddingVertical: 15, marginBottom: 16,
    borderWidth: 1, borderColor: C.border,
  },
  statItem: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 7,
  },
  statVal: { color: C.textPrimary, fontSize: 15, fontWeight: '700' },
  statSep: { width: 1, height: 20, backgroundColor: C.surface3 },

  // CTA
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.teal, borderRadius: 16, paddingVertical: 16,
    shadowColor: C.teal, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12,
  },
  ctaText: { color: C.bg, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
});
