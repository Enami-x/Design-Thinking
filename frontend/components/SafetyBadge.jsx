import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, safetyColor } from '../constants/theme';

export default function SafetyBadge({ score, size = 'normal' }) {
  const color = safetyColor(score);
  const large = size === 'large';

  return (
    <View style={[
      s.badge,
      { borderColor: color + '40', backgroundColor: color + '14' },
      large && s.badgeLg,
    ]}>
      <Ionicons name="shield-checkmark" size={large ? 16 : 13} color={color} />
      <Text style={[s.label, { color }, large && s.labelLg]}>
        {score}%
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
  },
  badgeLg: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 22 },
  label: { fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },
  labelLg: { fontSize: 16 },
});
