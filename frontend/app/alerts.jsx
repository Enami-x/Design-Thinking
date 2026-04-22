import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MOCK_ALERTS } from '../data/mockData';
import { C } from '../constants/theme';

const SEV_COLOR = { high: C.danger, medium: C.caution, low: C.textSecondary };
const SEV_DIM   = { high: C.dangerDim, medium: C.cautionDim, low: 'rgba(100,116,139,0.12)' };
const CAT_ICON  = {
  'poor-lighting': 'bulb-outline',
  'suspicious':    'eye-outline',
  'harassment':    'hand-right-outline',
  'road':          'warning-outline',
};

const FILTERS = ['All', 'Nearby', 'Recent'];

function AlertCard({ alert, index }) {
  const translateY = useRef(new Animated.Value(24)).current;
  const opacity    = useRef(new Animated.Value(0)).current;
  const [upvoted, setUpvoted] = useState(false);
  const [votes, setVotes]     = useState(alert.upvotes);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 0, duration: 280, delay: index * 65, useNativeDriver: true }),
      Animated.timing(opacity,    { toValue: 1, duration: 280, delay: index * 65, useNativeDriver: true }),
    ]).start();
  }, []);

  const color    = SEV_COLOR[alert.severity];
  const dimColor = SEV_DIM[alert.severity];

  return (
    <Animated.View style={[s.card, { opacity, transform: [{ translateY }] }]}>
      {/* left accent */}
      <View style={[s.cardAccent, { backgroundColor: color }]} />

      <View style={s.cardBody}>
        {/* Top row */}
        <View style={s.cardTop}>
          <View style={[s.iconBg, { backgroundColor: dimColor }]}>
            <Ionicons name={CAT_ICON[alert.type] || 'alert-circle-outline'} size={16} color={color} />
          </View>
          <View style={s.cardTitleBlock}>
            <Text style={s.cardTitle}>{alert.title}</Text>
            <Text style={s.cardLocation} numberOfLines={1}>{alert.location}</Text>
          </View>
          {/* Upvote */}
          <TouchableOpacity
            style={s.upvoteBtn}
            onPress={() => { setUpvoted(v => !v); setVotes(v => upvoted ? v - 1 : v + 1); }}
          >
            <Ionicons
              name={upvoted ? 'arrow-up-circle' : 'arrow-up-circle-outline'}
              size={17}
              color={upvoted ? C.teal : C.textSecondary}
            />
            <Text style={[s.upvoteCount, { color: upvoted ? C.teal : C.textSecondary }]}>
              {votes}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Meta row */}
        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <Ionicons name="location-outline" size={11} color={C.textSecondary} />
            <Text style={s.metaText}>{alert.distance} away</Text>
          </View>
          <View style={s.metaDot} />
          <View style={s.metaItem}>
            <Ionicons name="time-outline" size={11} color={C.textSecondary} />
            <Text style={s.metaText}>{alert.timeAgo}</Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function AlertsScreen() {
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = MOCK_ALERTS.filter(a => {
    if (activeFilter === 'Nearby') return parseFloat(a.distance) < 1;
    if (activeFilter === 'Recent') return a.timeAgo.includes('m');
    return true;
  });

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Nearby Alerts</Text>
        <View style={s.safeZonePill}>
          <View style={s.safeZoneDot} />
          <Text style={s.safeZoneText}>Safe zone</Text>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={s.filterRow}>
        <View style={s.filterBar}>
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f}
              style={[s.filterChip, activeFilter === f && s.filterChipActive]}
              onPress={() => setActiveFilter(f)}
              activeOpacity={0.75}
            >
              <Text style={[s.filterText, activeFilter === f && s.filterTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {filtered.length > 0
          ? filtered.map((alert, i) => <AlertCard key={alert.id} alert={alert} index={i} />)
          : (
            <View style={s.empty}>
              <View style={s.emptyIconBg}>
                <Ionicons name="checkmark-circle-outline" size={40} color={C.safe} />
              </View>
              <Text style={s.emptyTitle}>All clear!</Text>
              <Text style={s.emptySub}>No incidents matching this filter.</Text>
            </View>
          )
        }
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 58, paddingHorizontal: 20, paddingBottom: 16,
  },
  headerTitle: { color: C.textPrimary, fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  safeZonePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.safeDim, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: C.safe + '35',
  },
  safeZoneDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.safe },
  safeZoneText: { color: C.safe, fontSize: 12, fontWeight: '700' },

  filterRow: { paddingHorizontal: 20, marginBottom: 14 },
  filterBar: {
    flexDirection: 'row', gap: 6,
    backgroundColor: C.surface, borderRadius: 14, padding: 4,
    borderWidth: 1, borderColor: C.border,
    alignSelf: 'flex-start',
  },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 11,
  },
  filterChipActive: { backgroundColor: C.surface3 },
  filterText: { color: C.textSecondary, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: C.textPrimary, fontWeight: '700' },

  scroll: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },

  card: {
    backgroundColor: C.surface, borderRadius: 16,
    flexDirection: 'row', overflow: 'hidden',
    borderWidth: 1, borderColor: C.border,
  },
  cardAccent: { width: 3 },
  cardBody: { flex: 1, padding: 14, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cardTitleBlock: { flex: 1 },
  cardTitle: { color: C.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 2 },
  cardLocation: { color: C.textSecondary, fontSize: 11, lineHeight: 16 },
  upvoteBtn: { alignItems: 'center', gap: 2, paddingLeft: 4 },
  upvoteCount: { fontSize: 11, fontWeight: '700' },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: C.textSecondary, fontSize: 11 },
  metaDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.textSecondary },

  empty: { alignItems: 'center', paddingTop: 72, gap: 12 },
  emptyIconBg: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: C.safeDim, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: { color: C.textPrimary, fontSize: 20, fontWeight: '700' },
  emptySub: { color: C.textSecondary, fontSize: 14 },
});
