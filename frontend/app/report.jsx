import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Animated, Platform, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { C } from '../constants/theme';

import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import { API } from '../services/api';

const CATEGORIES = [
  { id: 'lighting',   label: 'Poor Lighting', icon: 'bulb-outline' },
  { id: 'harassment', label: 'Harassment',    icon: 'hand-right-outline' },
  { id: 'suspicious', label: 'Suspicious',    icon: 'eye-outline' },
  { id: 'road',       label: 'Unsafe Road',   icon: 'warning-outline' },
  { id: 'other',      label: 'Other',         icon: 'ellipsis-horizontal-circle-outline' },
];

const TIME_OPTIONS = [
  { key: 'now',           label: 'Now' },
  { key: 'earlier today', label: 'Earlier today' },
  { key: 'this week',     label: 'This week' },
];

function MiniMap() {
  const mapRef = useRef(null);
  const pos = [17.4435, 78.3772];

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let map;
    const init = async () => {
      const L = (await import('leaflet')).default;
      if (mapRef.current && !mapRef.current._leaflet_id) {
        map = L.map(mapRef.current, { zoomControl: false }).setView(pos, 15);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '© OpenStreetMap', subdomains: 'abcd',
        }).addTo(map);
        const icon = L.divIcon({
          html: `<div style="width:26px;height:26px;border-radius:50% 50% 50% 0;background:#ff3b5c;border:3px solid white;transform:rotate(-45deg);box-shadow:0 0 14px rgba(255,59,92,0.65);"></div>`,
          className: '', iconSize: [26, 26], iconAnchor: [13, 26],
        });
        L.marker(pos, { icon, draggable: true }).addTo(map);
      }
    };
    init();
    return () => { if (map) map.remove(); };
  }, []);

  if (Platform.OS === 'web') {
    return <div ref={mapRef} style={{ width: '100%', height: '100%', borderRadius: '18px' }} />;
  }

  // Mobile WebView Map
  const mapHtml = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; background: #080c10; }
          #map { width: 100vw; height: 100vh; }
          .pin { width:26px; height:26px; border-radius:50% 50% 50% 0; background:#ff3b5c; border:3px solid white; transform:rotate(-45deg); box-shadow:0 0 14px rgba(255,59,92,0.65); }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const map = L.map('map', { zoomControl: false }).setView(${JSON.stringify(pos)}, 15);
          L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);
          const icon = L.divIcon({ html: '<div class="pin"></div>', className: '', iconSize: [26, 26], iconAnchor: [13, 26] });
          L.marker(${JSON.stringify(pos)}, { icon, draggable: true }).addTo(map);
        </script>
      </body>
    </html>
  `;

  return (
    <WebView
      originWhitelist={['*']}
      source={{ html: mapHtml }}
      style={{ backgroundColor: '#080c10', borderRadius: 18 }}
    />
  );
}

export default function ReportScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTime, setSelectedTime] = useState('now');
  const [anonymous, setAnonymous] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [otherNote, setOtherNote] = useState('');
  const successAnim = useRef(new Animated.Value(0)).current;

  const handleSubmit = async () => {
    if (!selectedCategory) return;
    setSubmitError('');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') throw new Error('Location permission denied');

      const loc = await Location.getCurrentPositionAsync({});

      const payload = {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        type: selectedCategory === 'lighting' ? 'poor-lighting' : selectedCategory,
        time_of_day: selectedTime,
        anonymous,
        ...(selectedCategory === 'other' && otherNote ? { note: otherNote } : {}),
      };

      await API.reportIncident(payload);

      setSubmitted(true);
      setOtherNote('');
      Animated.spring(successAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 })
        .start(() => setTimeout(() => {
          setSubmitted(false);
          successAnim.setValue(0);
          setSelectedCategory(null);
          setSelectedTime('now');
          router.push('/alerts');
        }, 1400));
    } catch (err) {
      setSubmitError('Failed to submit report. Please check your connection and try again.');
    }
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color={C.textPrimary} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Report an Incident</Text>
          <Text style={s.headerSub}>Help keep the community safe</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Mini map */}
        <View style={s.mapWrap}>
          <MiniMap />
          <View style={s.mapHint}>
            <Ionicons name="move-outline" size={13} color={C.textSecondary} />
            <Text style={s.mapHintText}>Pin and drag to exact location</Text>
          </View>
        </View>

        {/* Category */}
        <Text style={s.sectionLabel}>CATEGORY</Text>
        <View style={s.chipWrap}>
          {CATEGORIES.map(cat => {
            const active = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[s.chip, active && s.chipActive]}
                onPress={() => setSelectedCategory(cat.id)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={active ? C.bg : C.textSecondary}
                />
                <Text style={[s.chipLabel, active && s.chipLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Other description input */}
        {selectedCategory === 'other' && (
          <TextInput
            style={s.otherInput}
            placeholder="Briefly describe what happened…"
            placeholderTextColor={C.textSecondary}
            value={otherNote}
            onChangeText={setOtherNote}
            multiline
            numberOfLines={3}
          />
        )}

        {/* Time */}
        <Text style={s.sectionLabel}>WHEN DID THIS HAPPEN?</Text>
        <View style={s.timeRow}>
          {TIME_OPTIONS.map(opt => {
            const active = selectedTime === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[s.timeChip, active && s.timeChipActive]}
                onPress={() => setSelectedTime(opt.key)}
                activeOpacity={0.75}
              >
                <Text style={[s.timeLabel, active && s.timeLabelActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Anonymous toggle */}
        <View style={s.toggleCard}>
          <View style={s.toggleLeft}>
            <View style={s.toggleIconBg}>
              <Ionicons name="person-outline" size={16} color={C.teal} />
            </View>
            <View>
              <Text style={s.toggleTitle}>Anonymous mode</Text>
              <Text style={s.toggleSub}>Your identity won't be shared</Text>
            </View>
          </View>
          <Switch
            value={anonymous}
            onValueChange={setAnonymous}
            trackColor={{ false: C.surface3, true: C.teal }}
            thumbColor="#fff"
            ios_backgroundColor={C.surface3}
          />
        </View>

        {/* Submit */}
        {submitError ? <Text style={s.submitError}>{submitError}</Text> : null}
        <TouchableOpacity
          style={[s.submitBtn, !selectedCategory && s.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!selectedCategory}
          activeOpacity={0.85}
        >
          {submitted ? (
            <Animated.View style={[s.submitInner, { opacity: successAnim, transform: [{ scale: successAnim }] }]}>
              <Ionicons name="checkmark-circle" size={20} color={C.bg} />
              <Text style={s.submitText}>Report Submitted ✓</Text>
            </Animated.View>
          ) : (
            <Text style={s.submitText}>Submit Report</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 58, paddingHorizontal: 16, paddingBottom: 14,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12, backgroundColor: C.surface2,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: C.border,
  },
  headerCenter: { alignItems: 'center' },
  headerTitle: { color: C.textPrimary, fontSize: 17, fontWeight: '700', letterSpacing: -0.2 },
  headerSub: { color: C.textSecondary, fontSize: 12, marginTop: 3, fontWeight: '400' },

  scroll: { paddingHorizontal: 16, paddingBottom: 40 },

  mapWrap: {
    height: 196, borderRadius: 18, overflow: 'hidden',
    marginBottom: 26, borderWidth: 1, borderColor: C.border,
  },
  miniMap: { flex: 1 },
  mapHint: {
    position: 'absolute', bottom: 12, left: '50%',
    transform: [{ translateX: -105 }],
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(8,12,16,0.88)', paddingHorizontal: 14,
    paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: C.border,
  },
  mapHintText: { color: C.textSecondary, fontSize: 12 },

  sectionLabel: {
    color: C.textSecondary, fontSize: 10, fontWeight: '700',
    letterSpacing: 1.5, marginBottom: 12,
  },

  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 26 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.surface, borderRadius: 22,
    paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1, borderColor: C.border,
  },
  chipActive: { backgroundColor: C.teal, borderColor: C.teal },
  chipLabel: { color: C.textSecondary, fontSize: 13, fontWeight: '500' },
  chipLabelActive: { color: C.bg, fontWeight: '700' },

  timeRow: { flexDirection: 'row', gap: 8, marginBottom: 26 },
  timeChip: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    backgroundColor: C.surface, borderRadius: 14,
    borderWidth: 1, borderColor: C.border,
  },
  timeChipActive: { borderColor: C.teal, backgroundColor: C.tealDim },
  timeLabel: { color: C.textSecondary, fontSize: 13, fontWeight: '500' },
  timeLabelActive: { color: C.teal, fontWeight: '700' },

  toggleCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 26,
    borderWidth: 1, borderColor: C.border,
  },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleIconBg: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.tealDim, alignItems: 'center', justifyContent: 'center',
  },
  toggleTitle: { color: C.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  toggleSub: { color: C.textSecondary, fontSize: 12 },

  submitBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: C.teal, borderRadius: 18, paddingVertical: 18,
    shadowColor: C.teal, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 14,
  },
  submitBtnDisabled: { opacity: 0.3, shadowOpacity: 0 },
  submitInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitText: { color: C.bg, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
  submitError: { color: C.danger, fontSize: 13, marginBottom: 12, textAlign: 'center' },

  otherInput: {
    backgroundColor: C.surface, borderRadius: 14, borderWidth: 1, borderColor: C.teal,
    color: C.textPrimary, fontSize: 14, padding: 14, marginBottom: 26,
    minHeight: 80, textAlignVertical: 'top',
  },
});
