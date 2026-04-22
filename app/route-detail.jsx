import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { C } from '../constants/theme';

const SEGMENTS = [
  { label: 'Hitech City Rd', status: 'safe',    pct: 30 },
  { label: 'Durgam Cheruvu', status: 'safe',    pct: 25 },
  { label: 'Ayyappa Society', status: 'caution', pct: 20 },
  { label: 'Madhapur Main',  status: 'safe',    pct: 15 },
  { label: 'Inorbit Entry',  status: 'unsafe',  pct: 10 },
];
const SEG_COLOR = { safe: C.safe, caution: C.caution, unsafe: C.danger };
const SEG_DIM   = { safe: C.safeDim, caution: C.cautionDim, unsafe: C.dangerDim };

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
  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backRow}>
          <Ionicons name="arrow-back-outline" size={15} color={C.textSecondary} />
          <Text style={s.backText}>Back to map</Text>
        </TouchableOpacity>
        <View style={s.safetyPill}>
          <Ionicons name="checkmark-circle" size={13} color={C.safe} />
          <Text style={s.safetyPillText}>Safety 87%</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Title */}
        <Text style={s.title}>Hitech City → Madhapur</Text>
        <Text style={s.meta}>2.4 km  ·  26 min walk</Text>

        {/* Safety Breakdown */}
        <SectionLabel>SAFETY BREAKDOWN</SectionLabel>
        <View style={s.bRow}>
          <BreakdownCard icon="flashlight-outline" label="Lighting"  value="Good"     color={C.safe}    dimColor={C.safeDim} />
          <BreakdownCard icon="people-outline"     label="Crowd"     value="Moderate"  color={C.caution} dimColor={C.cautionDim} />
          <BreakdownCard icon="warning-outline"    label="Incidents" value="2 nearby"  color={C.danger}  dimColor={C.dangerDim} />
        </View>

        {/* Route Segments */}
        <SectionLabel>ROUTE SEGMENTS</SectionLabel>
        <View style={s.segCard}>
          {/* Progress bar */}
          <View style={s.segBar}>
            {SEGMENTS.map((seg, i) => (
              <View
                key={i}
                style={[
                  s.segBlock,
                  {
                    flex: seg.pct,
                    backgroundColor: SEG_COLOR[seg.status],
                    borderTopLeftRadius: i === 0 ? 8 : 0,
                    borderBottomLeftRadius: i === 0 ? 8 : 0,
                    borderTopRightRadius: i === SEGMENTS.length - 1 ? 8 : 0,
                    borderBottomRightRadius: i === SEGMENTS.length - 1 ? 8 : 0,
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
        <TouchableOpacity style={s.startBtn} onPress={() => router.push('/sos')} activeOpacity={0.85}>
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
    backgroundColor: C.safeDim, borderRadius: 20,
    paddingHorizontal: 11, paddingVertical: 5,
    borderWidth: 1, borderColor: C.safe + '35',
  },
  safetyPillText: { color: C.safe, fontSize: 12, fontWeight: '700' },

  scroll: { paddingHorizontal: 20, paddingBottom: 48 },

  title: {
    color: C.textPrimary, fontSize: 28, fontWeight: '800',
    letterSpacing: -0.7, marginTop: 14, marginBottom: 6,
  },
  meta: { color: C.textSecondary, fontSize: 14, marginBottom: 32 },

  sectionLabel: {
    color: C.textSecondary, fontSize: 10, fontWeight: '700',
    letterSpacing: 1.5, marginBottom: 12,
  },

  // Breakdown
  bRow: { flexDirection: 'row', gap: 10, marginBottom: 32 },
  bCard: {
    flex: 1, backgroundColor: C.surface, borderRadius: 16,
    padding: 14, alignItems: 'center', gap: 8,
    borderWidth: 1,
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
  segBar: {
    flexDirection: 'row', height: 10, borderRadius: 8,
    overflow: 'hidden', marginBottom: 14,
  },
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
