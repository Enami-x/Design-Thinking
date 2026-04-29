import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { C } from '../constants/theme';

const SHARE_CONTACTS = [
  { initial: 'P', bg: '#5b21b6' },
  { initial: 'M', bg: '#0e7490' },
  { initial: 'S', bg: '#065f46' },
];

function BreakdownCard({ icon, label, value, color, dimColor }) {
  return (
    <View style={[s.bCard, { borderColor: color + '28' }]}>
      <View style={[s.bIconBg, { backgroundColor: dimColor }]}>
        <Ionicons name={icon} size={19} color={color} />
      </View>
      <Text style={[s.bValue, { color }]}>{value}</Text>
      <Text style={s.bLabel}>{label}</Text>
    </View>
  );
}

function SectionLabel({ children }) {
  return <Text style={s.sectionLabel}>{children}</Text>;
}

export default function RouteDetailScreen() {
  const router = useRouter();

  // Read params passed from the home screen
  const p = useLocalSearchParams();

  const activeRoute  = p.activeRoute  ?? 'safest';
  const destName     = p.destName     ?? 'Your Destination';
  const safestKm     = p.safestKm     ?? '--';
  const safestTime   = p.safestTime   ?? '--';
  const fastestKm    = p.fastestKm    ?? '--';
  const fastestTime  = p.fastestTime  ?? '--';
  const safetyScore  = activeRoute === 'fastest'
    ? Number(p.fastestScore ?? 55)
    : Number(p.safestScore  ?? 78);
  const km   = activeRoute === 'fastest' ? fastestKm   : safestKm;
  const time = activeRoute === 'fastest' ? fastestTime : safestTime;

  // Breakdown values (floats passed as strings via URL params)
  const lighting        = parseFloat(p.lighting        ?? '0.8');
  const crowd           = parseFloat(p.crowd           ?? '0.5');
  const incidentDensity = parseInt  (p.incidentDensity ?? '0', 10);

  const lightingLabel = lighting > 0.7 ? 'Good' : lighting > 0.4 ? 'Fair' : 'Poor';
  const crowdLabel    = crowd    > 0.7 ? 'Busy' : crowd    > 0.3 ? 'Moderate' : 'Empty';
  const incLabel      = incidentDensity === 0 ? 'Clear' : `${incidentDensity} nearby`;

  const lightingColor = lighting > 0.4 ? C.safe    : C.danger;
  const lightingDim   = lighting > 0.4 ? C.safeDim : C.dangerDim;
  const crowdColor    = crowd    > 0.3 ? C.caution : C.danger;
  const crowdDim      = crowd    > 0.3 ? C.cautionDim : C.dangerDim;
  const incColor      = incidentDensity === 0 ? C.safe    : C.danger;
  const incDim        = incidentDensity === 0 ? C.safeDim : C.dangerDim;

  const scoreColor    = safetyScore >= 75 ? C.safe : safetyScore >= 45 ? C.caution : C.danger;

  // Dynamic route segments based on safety score
  const segments = safetyScore >= 75
    ? [
        { status: 'safe',    pct: 50 },
        { status: 'safe',    pct: 30 },
        { status: 'caution', pct: 20 },
      ]
    : safetyScore >= 45
    ? [
        { status: 'safe',    pct: 30 },
        { status: 'caution', pct: 40 },
        { status: 'unsafe',  pct: 30 },
      ]
    : [
        { status: 'caution', pct: 20 },
        { status: 'unsafe',  pct: 50 },
        { status: 'unsafe',  pct: 30 },
      ];

  const SEG_COLOR = { safe: C.safe, caution: C.caution, unsafe: C.danger };

  // Shorten destination for display title
  const shortDest = destName.split(',')[0].trim();

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backRow}>
          <Ionicons name="arrow-back-outline" size={15} color={C.textSecondary} />
          <Text style={s.backText}>Back to map</Text>
        </TouchableOpacity>
        <View style={[s.safetyPill, { backgroundColor: scoreColor + '22', borderColor: scoreColor + '50' }]}>
          <Ionicons name="checkmark-circle" size={13} color={scoreColor} />
          <Text style={[s.safetyPillText, { color: scoreColor }]}>
            Safety {safetyScore}%
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Title */}
        <Text style={s.title} numberOfLines={1}>
          Your Location → {shortDest}
        </Text>
        <Text style={s.meta}>
          {km === '--' || km === 'N/A' ? `${km} km` : `${km}`}
          {'  ·  '}
          {time === '--' || time === 'N/A' ? `${time} min` : `${time} min walk`}
        </Text>

        {/* Route toggle indicator */}
        <View style={s.routeTypePill}>
          <Ionicons
            name={activeRoute === 'safest' ? 'shield-checkmark' : 'flash'}
            size={13}
            color={activeRoute === 'safest' ? C.teal : C.caution}
          />
          <Text style={[s.routeTypeText, { color: activeRoute === 'safest' ? C.teal : C.caution }]}>
            {activeRoute === 'safest' ? 'Safest Route' : 'Fastest Route'}
          </Text>
        </View>

        {/* Safety Breakdown */}
        <SectionLabel>SAFETY BREAKDOWN</SectionLabel>
        <View style={s.bRow}>
          <BreakdownCard
            icon="flashlight-outline"
            label="Lighting"
            value={lightingLabel}
            color={lightingColor}
            dimColor={lightingDim}
          />
          <BreakdownCard
            icon="people-outline"
            label="Crowd"
            value={crowdLabel}
            color={crowdColor}
            dimColor={crowdDim}
          />
          <BreakdownCard
            icon="warning-outline"
            label="Incidents"
            value={incLabel}
            color={incColor}
            dimColor={incDim}
          />
        </View>

        {/* Route Segments */}
        <SectionLabel>ROUTE SEGMENTS</SectionLabel>
        <View style={s.segCard}>
          {/* Progress bar */}
          <View style={s.segBar}>
            {segments.map((seg, i) => (
              <View
                key={i}
                style={[
                  s.segBlock,
                  {
                    flex: seg.pct,
                    backgroundColor: SEG_COLOR[seg.status],
                    borderTopLeftRadius: i === 0 ? 8 : 0,
                    borderBottomLeftRadius: i === 0 ? 8 : 0,
                    borderTopRightRadius: i === segments.length - 1 ? 8 : 0,
                    borderBottomRightRadius: i === segments.length - 1 ? 8 : 0,
                  }
                ]}
              />
            ))}
          </View>
          {/* Legend */}
          <View style={s.segLegend}>
            {[
              { label: 'Safe',    color: C.safe },
              { label: 'Caution', color: C.caution },
              { label: 'Unsafe',  color: C.danger },
            ].map(item => (
              <View key={item.label} style={s.legendItem}>
                <View style={[s.legendDot, { backgroundColor: item.color }]} />
                <Text style={s.legendText}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Share With */}
        <SectionLabel>SHARE WITH</SectionLabel>
        <View style={s.shareRow}>
          {SHARE_CONTACTS.map((c, i) => (
            <View key={i} style={[s.shareAvatar, { backgroundColor: c.bg }]}>
              <Text style={s.shareInitial}>{c.initial}</Text>
            </View>
          ))}
          <TouchableOpacity style={s.shareLinkBtn}>
            <Ionicons name="share-social-outline" size={13} color={C.teal} />
            <Text style={s.shareLinkText}>share route</Text>
          </TouchableOpacity>
        </View>

        {/* Start Journey */}
        <TouchableOpacity
          style={s.startBtn}
          onPress={() => router.push({
            pathname: '/sos',
            params: {
              destLat:  p.destLat  ?? '',
              destLng:  p.destLng  ?? '',
              destName: shortDest,
              timeMins: time,   // e.g. "26" or "26 min walk"
            },
          })}
          activeOpacity={0.85}
        >
          <Text style={s.startBtnText}>Start Journey</Text>
          <Ionicons name="arrow-forward" size={18} color={C.bg} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 4,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  backText: { color: C.textSecondary, fontSize: 13, fontWeight: '500' },
  safetyPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5,
    borderWidth: 1,
  },
  safetyPillText: { fontSize: 12, fontWeight: '700' },

  scroll: { paddingHorizontal: 20, paddingBottom: 48 },

  title: {
    color: C.textPrimary, fontSize: 26, fontWeight: '800',
    letterSpacing: -0.7, marginTop: 14, marginBottom: 6,
  },
  meta: { color: C.textSecondary, fontSize: 14, marginBottom: 12 },

  routeTypePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', marginBottom: 28,
    backgroundColor: C.surface2, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: C.border,
  },
  routeTypeText: { fontSize: 12, fontWeight: '700' },

  sectionLabel: {
    color: C.textSecondary, fontSize: 10, fontWeight: '700',
    letterSpacing: 1.5, marginBottom: 12,
  },

  // Breakdown
  bRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  bCard: {
    flex: 1, backgroundColor: C.surface, borderRadius: 16,
    padding: 14, alignItems: 'center', gap: 8, borderWidth: 1,
  },
  bIconBg: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  bValue: { fontSize: 14, fontWeight: '800' },
  bLabel: { color: C.textSecondary, fontSize: 11, fontWeight: '500' },

  // Segments
  segCard: {
    backgroundColor: C.surface, borderRadius: 16, padding: 16,
    marginBottom: 32, borderWidth: 1, borderColor: C.border,
  },
  segBar: { flexDirection: 'row', height: 10, borderRadius: 8, overflow: 'hidden', marginBottom: 14 },
  segBlock: { height: 10 },
  segLegend: { flexDirection: 'row', gap: 18 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { color: C.textSecondary, fontSize: 12 },

  // Share
  shareRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 32 },
  shareAvatar: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.08)',
  },
  shareInitial: { color: '#fff', fontSize: 15, fontWeight: '700' },
  shareLinkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: C.tealDim, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: C.teal + '30',
  },
  shareLinkText: { color: C.teal, fontSize: 13, fontWeight: '600' },

  // Start
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: C.teal, borderRadius: 18, paddingVertical: 18,
    shadowColor: C.teal, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 14,
  },
  startBtnText: { color: C.bg, fontSize: 17, fontWeight: '800', letterSpacing: 0.2 },
});
