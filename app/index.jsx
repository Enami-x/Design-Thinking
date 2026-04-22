import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Animated, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { HEATMAP_REGIONS } from '../data/mockData';
import { C } from '../constants/theme';

const HEATMAP_COLORS = { safe: '#10d97e', caution: '#f5a623', danger: '#ff3b5c' };

function WebMap() {
  const mapRef = useRef(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let map;
    const init = async () => {
      const L = (await import('leaflet')).default;
      if (mapRef.current && !mapRef.current._leaflet_id) {
        map = L.map(mapRef.current, { zoomControl: false }).setView([17.4435, 78.3772], 14);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap', subdomains: 'abcd',
        }).addTo(map);
        HEATMAP_REGIONS.forEach(r => {
          const col = HEATMAP_COLORS[r.type];
          L.circle([r.lat, r.lng], {
            radius: r.radius, color: col, fillColor: col,
            fillOpacity: 0.18, weight: 1,
          }).addTo(map);
        });
        const route = [[17.4435, 78.3772],[17.4402, 78.3820],[17.4370, 78.3845],[17.4345, 78.3861]];
        L.polyline(route, { color: '#00d4b0', weight: 4, opacity: 0.9 }).addTo(map);
        const icon = L.divIcon({
          html: `<div style="width:14px;height:14px;border-radius:50%;background:#00d4b0;border:2.5px solid white;box-shadow:0 0 12px rgba(0,212,176,0.9);"></div>`,
          className: '', iconSize: [14, 14], iconAnchor: [7, 7],
        });
        L.marker([17.4435, 78.3772], { icon }).addTo(map);
      }
    };
    init();
    return () => { if (map) map.remove(); };
  }, []);

  if (Platform.OS !== 'web') {
    return (
      <View style={[s.mapFallback]}>
        <Ionicons name="map-outline" size={56} color={C.teal} />
        <Text style={s.mapFallbackText}>Map available on web</Text>
      </View>
    );
  }
  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

export default function HomeScreen() {
  const router = useRouter();
  const [activeRoute, setActiveRoute] = useState('safest');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const routes = {
    safest:  { km: '2.4 km', time: '28 min', safety: 87 },
    fastest: { km: '1.9 km', time: '12 min', safety: 61 },
  };
  const cur = routes[activeRoute];
  const safetyCol = cur.safety >= 75 ? C.safe : C.caution;

  return (
    <View style={s.container}>
      {/* Full-bleed map */}
      <View style={s.mapContainer}>
        <WebMap />
      </View>

      {/* Search bar overlay */}
      <Animated.View style={[s.searchWrap, { opacity: fadeAnim }]}>
        <View style={s.searchBar}>
          <Ionicons name="search-outline" size={17} color={C.textSecondary} />
          <TextInput
            style={s.searchInput}
            placeholder="Where are you going?"
            placeholderTextColor={C.textSecondary}
          />
          <View style={s.micBtn}>
            <Ionicons name="mic-outline" size={16} color={C.teal} />
          </View>
        </View>
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
            <Text style={[s.statVal, { color: safetyCol }]}>{cur.safety}%</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={s.cta}
          onPress={() => router.push('/route-detail')}
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
  mapFallback: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.surface,
  },
  mapFallbackText: { color: C.textSecondary, marginTop: 12, fontSize: 14 },

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
