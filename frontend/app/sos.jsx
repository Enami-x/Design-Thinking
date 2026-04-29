import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TRUSTED_CONTACTS } from '../data/mockData';
import { C } from '../constants/theme';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { getRouteStore, clearRouteStore } from '../store/routeStore';

const AVATAR_COLORS = ['#5b21b6', '#0e7490', '#065f46'];

// ─── Timer — starts at 0:00 when screen mounts ────────────────────────────────
function useTimer() {
  const [sec, setSec] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSec(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Live Map — draws the actual ORS road-following route ────────────────────
function LiveMap({ destCoords, routeCoords }) {
  const mapRef       = useRef(null);
  const [userCoords, setUserCoords] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserCoords([loc.coords.latitude, loc.coords.longitude]);
    })();
  }, []);

  // Web: Leaflet — re-init when coords change
  useEffect(() => {
    if (Platform.OS !== 'web' || !userCoords) return;
    let map;
    const init = async () => {
      const L  = (await import('leaflet')).default;
      const el = mapRef.current;
      if (!el) return;
      if (el._leaflet_id) { try { L.map(el).remove(); } catch (_) {} }

      const dest    = destCoords ?? [userCoords[0] - 0.015, userCoords[1] + 0.009];
      // Use full ORS polyline if available, otherwise straight line
      const linePoints = (routeCoords && routeCoords.length > 2) ? routeCoords : [userCoords, dest];

      map = L.map(el, { zoomControl: false });
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap', subdomains: 'abcd',
      }).addTo(map);

      L.polyline(linePoints, { color: '#00d4b0', weight: 5, opacity: 0.9 }).addTo(map);
      map.fitBounds(L.polyline(linePoints).getBounds(), { padding: [40, 40] });

      const userIcon = L.divIcon({
        html: `<div style="width:22px;height:22px;display:flex;align-items:center;justify-content:center;position:relative;">
          <div style="position:absolute;inset:0;border-radius:50%;background:#00d4b0;opacity:0.2;"></div>
          <div style="width:12px;height:12px;border-radius:50%;background:#00d4b0;border:2.5px solid white;"></div>
        </div>`,
        className: '', iconSize: [22, 22], iconAnchor: [11, 11],
      });
      L.marker(userCoords, { icon: userIcon }).addTo(map);
      L.circleMarker(dest, { radius: 8, color: '#10d97e', fillColor: '#10d97e', fillOpacity: 0.9, weight: 2 }).addTo(map);
    };
    init();
    return () => { if (map) map.remove(); };
  }, [userCoords, destCoords, routeCoords]);

  if (Platform.OS === 'web') {
    return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
  }

  // Mobile: loading until GPS ready
  if (!userCoords) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#080c10' }}>
        <Text style={{ color: C.textSecondary, fontSize: 13 }}>Getting your location…</Text>
      </View>
    );
  }

  const dest       = destCoords ?? [userCoords[0] - 0.015, userCoords[1] + 0.009];
  const linePoints = (routeCoords && routeCoords.length > 2) ? routeCoords : [userCoords, dest];
  const mapKey     = `${userCoords[0]},${userCoords[1]}_${dest[0]},${dest[1]}_${linePoints.length}`;

  const mapHtml = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; background: #080c10; }
          #map { width: 100vw; height: 100vh; }
          @keyframes pulse {
            0%   { transform: scale(1); opacity: 0.5; }
            50%  { transform: scale(2.5); opacity: 0; }
            100% { transform: scale(1); opacity: 0; }
          }
          .pulse-ring  { position: absolute; inset: 0; border-radius: 50%; background: #00d4b0; animation: pulse 2s ease-out infinite; }
          .pulse-ring2 { position: absolute; inset: 0; border-radius: 50%; background: #00d4b0; animation: pulse 2s ease-out 0.6s infinite; }
          .user-dot  { width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; position: relative; }
          .user-core { width: 12px; height: 12px; border-radius: 50%; background: #00d4b0; border: 2.5px solid white; position: relative; z-index: 2; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const user       = ${JSON.stringify(userCoords)};
          const dest       = ${JSON.stringify(dest)};
          const linePoints = ${JSON.stringify(linePoints)};
          const map        = L.map('map', { zoomControl: false });

          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

          // Draw the full road-following polyline (or straight line as fallback)
          const poly = L.polyline(linePoints, {
            color: '#00d4b0', weight: 5, opacity: 0.9
          }).addTo(map);

          map.fitBounds(poly.getBounds(), { padding: [50, 50] });

          // Pulsing user location dot
          const userIcon = L.divIcon({
            html: '<div class="user-dot"><div class="pulse-ring"></div><div class="pulse-ring2"></div><div class="user-core"></div></div>',
            className: '', iconSize: [22, 22], iconAnchor: [11, 11]
          });
          L.marker(user, { icon: userIcon }).addTo(map);

          // Destination dot
          L.circleMarker(dest, {
            radius: 8, color: '#10d97e', fillColor: '#10d97e', fillOpacity: 0.9, weight: 2
          }).addTo(map);
        </script>
      </body>
    </html>
  `;

  return (
    <WebView
      key={mapKey}
      originWhitelist={['*']}
      source={{ html: mapHtml }}
      style={{ backgroundColor: '#080c10' }}
      javaScriptEnabled
    />
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function SOSScreen() {
  const router       = useRouter();
  const p            = useLocalSearchParams();
  const timer        = useTimer();
  const [sosActive, setSosActive] = useState(false);
  const sosScale     = useRef(new Animated.Value(1)).current;

  // ── Resolve destination: global store first, URL params as fallback ──────────
  // The global store is always populated when a route was built in index.jsx,
  // even when the user taps the Journey tab directly (bypassing route-detail).
  const store = getRouteStore();

  const destLat    = store.destLat     ?? (p.destLat  ? parseFloat(p.destLat)  : null);
  const destLng    = store.destLng     ?? (p.destLng  ? parseFloat(p.destLng)  : null);
  const destName   = store.destName    ?? p.destName  ?? null;
  const rawTime    = store.timeMins    ?? (p.timeMins ? parseInt(String(p.timeMins), 10) : null);
  const routeCoords = store.routeCoords ?? null;  // full ORS polyline [[lat,lng],...]

  const etaLabel   = rawTime ? `ETA ~${rawTime} min` : 'Journey in progress';
  const destCoords = (destLat && destLng) ? [destLat, destLng] : null;

  const handleSOS = () => {
    setSosActive(true);
    Animated.sequence([
      Animated.timing(sosScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.spring(sosScale,  { toValue: 1,   friction: 4,   useNativeDriver: true }),
    ]).start();
  };

  return (
    <View style={s.container}>
      {/* Immersive map */}
      <View style={s.mapWrap}>
        <LiveMap destCoords={destCoords} routeCoords={routeCoords} />

        {/* Timer chip — top right */}
        <View style={s.timerChip}>
          <View style={s.liveDot} />
          <View>
            <Text style={s.timerValue}>{timer}</Text>
            <Text style={s.timerEta}>{etaLabel}</Text>
          </View>
        </View>

        {/* Walk icon — top left */}
        <View style={s.walkChip}>
          <Ionicons name="walk-outline" size={18} color={C.teal} />
        </View>

        {/* Destination label — top centre */}
        {destName ? (
          <View style={s.destChip}>
            <Ionicons name="location" size={12} color={C.safe} />
            <Text style={s.destText} numberOfLines={1}>{destName}</Text>
          </View>
        ) : null}
      </View>

      {/* Bottom panel */}
      <View style={s.panel}>
        <View style={s.handle} />

        {/* Sharing with */}
        <Text style={s.sharingLabel}>Sharing with</Text>
        <View style={s.contactsRow}>
          {TRUSTED_CONTACTS.map((c, i) => (
            <View key={c.id} style={s.contactItem}>
              <View style={[s.avatar, { backgroundColor: AVATAR_COLORS[i] }]}>
                <Text style={s.avatarInitial}>{c.initial}</Text>
                <View style={s.onlineDot} />
              </View>
              <Text style={s.contactName}>{c.name}</Text>
            </View>
          ))}
          <View style={s.contactItem}>
            <TouchableOpacity style={s.addBtn}>
              <Ionicons name="add" size={20} color={C.textSecondary} />
            </TouchableOpacity>
            <Text style={s.contactName}>Add</Text>
          </View>
        </View>

        {/* CTA Row */}
        <View style={s.ctaRow}>
          {/* I'm Safe */}
          <TouchableOpacity
            style={s.safeBtn}
            onPress={() => { clearRouteStore(); router.push('/'); }}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={s.safeBtnText}>I'm Safe</Text>
          </TouchableOpacity>

          {/* Send SOS */}
          <Animated.View style={{ transform: [{ scale: sosScale }] }}>
            <TouchableOpacity
              style={[s.sosBtn, sosActive && s.sosBtnActive]}
              onPress={handleSOS}
              activeOpacity={0.85}
            >
              <Ionicons name="alert-circle" size={20} color="#fff" />
              <Text style={s.sosBtnText}>
                {sosActive ? 'SOS SENT!' : 'Send SOS'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  mapWrap: { flex: 1, position: 'relative' },

  // Overlays
  timerChip: {
    position: 'absolute', top: 56, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(8,12,16,0.90)',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18,
    borderWidth: 1, borderColor: C.borderMd,
  },
  liveDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: C.danger },
  timerValue: { color: C.textPrimary, fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  timerEta:   { color: C.textSecondary, fontSize: 11, marginTop: 1 },

  walkChip: {
    position: 'absolute', top: 60, left: 16,
    backgroundColor: 'rgba(8,12,16,0.90)',
    padding: 10, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
  },

  destChip: {
    position: 'absolute', top: 60, left: 60, right: 60,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(8,12,16,0.90)',
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
    justifyContent: 'center',
  },
  destText: { color: C.textPrimary, fontSize: 12, fontWeight: '600', flexShrink: 1 },

  // Panel
  panel: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 36,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  handle: {
    width: 36, height: 3.5, borderRadius: 2, backgroundColor: C.surface3,
    alignSelf: 'center', marginBottom: 22,
  },

  sharingLabel: {
    color: C.textSecondary, fontSize: 11, fontWeight: '700',
    letterSpacing: 1, marginBottom: 16,
  },
  contactsRow:  { flexDirection: 'row', gap: 20, marginBottom: 28, alignItems: 'flex-start' },
  contactItem:  { alignItems: 'center', gap: 5 },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.08)',
  },
  avatarInitial: { color: '#fff', fontSize: 17, fontWeight: '800' },
  onlineDot: {
    position: 'absolute', top: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: C.safe, borderWidth: 2, borderColor: C.surface,
  },
  contactName: { color: C.textSecondary, fontSize: 11, fontWeight: '500' },
  addBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: C.surface2, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed',
  },

  // Buttons
  ctaRow: { flexDirection: 'row', gap: 12 },
  safeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.safe, borderRadius: 18, paddingVertical: 18,
    shadowColor: C.safe, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 14,
  },
  safeBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  sosBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: C.danger, borderRadius: 18,
    paddingVertical: 18, paddingHorizontal: 26,
    shadowColor: C.danger, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5, shadowRadius: 16,
  },
  sosBtnActive:  { backgroundColor: '#cc1f3e' },
  sosBtnText:    { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
});
