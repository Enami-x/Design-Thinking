import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { TRUSTED_CONTACTS } from '../data/mockData';
import { C } from '../constants/theme';

const AVATAR_COLORS = ['#5b21b6', '#0e7490', '#065f46'];

// ─── Hooks ────────────────────────────────────────────────
function useTimer(startSec = 872) {
  const [sec, setSec] = useState(startSec);
  useEffect(() => {
    const id = setInterval(() => setSec(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Pulsing location dot ─────────────────────────────────
function PulsingLocation() {
  const ring1 = useRef(new Animated.Value(1)).current;
  const op1   = useRef(new Animated.Value(0.5)).current;
  const ring2 = useRef(new Animated.Value(1)).current;
  const op2   = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const pulse = (ring, op, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(ring, { toValue: 3.2, duration: 1600, useNativeDriver: true }),
            Animated.timing(op,   { toValue: 0,   duration: 1600, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(ring, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(op,   { toValue: 0.5, duration: 0, useNativeDriver: true }),
          ]),
        ])
      ).start();
    pulse(ring1, op1, 0);
    pulse(ring2, op2, 600);
  }, []);

  return (
    <View style={ps.wrap}>
      <Animated.View style={[ps.ring, { opacity: op1, transform: [{ scale: ring1 }] }]} />
      <Animated.View style={[ps.ring, { opacity: op2, transform: [{ scale: ring2 }] }]} />
      <View style={ps.core} />
    </View>
  );
}

const ps = StyleSheet.create({
  wrap: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute', width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.teal,
  },
  core: {
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: C.teal, borderWidth: 2.5, borderColor: '#fff',
  },
});

// ─── Live Map ─────────────────────────────────────────────
function LiveMap() {
  const mapRef = useRef(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let map;
    const init = async () => {
      const L = (await import('leaflet')).default;
      if (mapRef.current && !mapRef.current._leaflet_id) {
        map = L.map(mapRef.current, { zoomControl: false }).setView([17.4435, 78.3772], 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap', subdomains: 'abcd',
        }).addTo(map);
        L.polyline(
          [[17.4435, 78.3772],[17.4402, 78.3820],[17.4370, 78.3845],[17.4345, 78.3861]],
          { color: C.teal, weight: 4, opacity: 0.9, dashArray: '10 8' }
        ).addTo(map);
        const userIcon = L.divIcon({
          html: `<div style="width:22px;height:22px;display:flex;align-items:center;justify-content:center;position:relative;">
            <div style="position:absolute;inset:0;border-radius:50%;background:${C.teal};opacity:0.2;"></div>
            <div style="width:12px;height:12px;border-radius:50%;background:${C.teal};border:2.5px solid white;"></div>
          </div>`,
          className: '', iconSize: [22, 22], iconAnchor: [11, 11],
        });
        L.marker([17.4435, 78.3772], { icon: userIcon }).addTo(map);
        L.circleMarker([17.4345, 78.3861], {
          radius: 7, color: C.safe, fillColor: C.safe, fillOpacity: 0.9,
        }).addTo(map);
      }
    };
    init();
    return () => { if (map) map.remove(); };
  }, []);

  if (Platform.OS !== 'web') {
    return (
      <View style={[s.liveMap, { justifyContent: 'center', alignItems: 'center' }]}>
        <PulsingLocation />
      </View>
    );
  }
  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

// ─── Main Screen ──────────────────────────────────────────
export default function SOSScreen() {
  const router = useRouter();
  const timer  = useTimer();
  const [sosActive, setSosActive] = useState(false);
  const sosScale = useRef(new Animated.Value(1)).current;

  const handleSOS = () => {
    setSosActive(true);
    Animated.sequence([
      Animated.timing(sosScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.spring(sosScale, { toValue: 1, friction: 4, useNativeDriver: true }),
    ]).start();
  };

  return (
    <View style={s.container}>
      {/* Immersive map */}
      <View style={s.mapWrap}>
        <LiveMap />

        {/* Timer chip — top right */}
        <View style={s.timerChip}>
          <View style={s.liveDot} />
          <View>
            <Text style={s.timerValue}>{timer}</Text>
            <Text style={s.timerEta}>ETA in 6 minutes</Text>
          </View>
        </View>

        {/* Walk icon — top left */}
        <View style={s.walkChip}>
          <Ionicons name="walk-outline" size={18} color={C.teal} />
        </View>
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
            onPress={() => router.push('/')}
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
  liveMap: { flex: 1, backgroundColor: C.surface2 },

  // Overlays
  timerChip: {
    position: 'absolute', top: 56, right: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(8,12,16,0.90)',
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18,
    borderWidth: 1, borderColor: C.borderMd,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.danger },
  timerValue: { color: C.textPrimary, fontSize: 20, fontWeight: '800', letterSpacing: 1 },
  timerEta: { color: C.textSecondary, fontSize: 11, marginTop: 1 },

  walkChip: {
    position: 'absolute', top: 60, left: 16,
    backgroundColor: 'rgba(8,12,16,0.90)',
    padding: 10, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
  },

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
  contactsRow: { flexDirection: 'row', gap: 20, marginBottom: 28, alignItems: 'flex-start' },
  contactItem: { alignItems: 'center', gap: 5 },
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
    borderWidth: 1.5, borderColor: C.border,
    borderStyle: 'dashed',
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
  sosBtnActive: { backgroundColor: '#cc1f3e' },
  sosBtnText: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
});
