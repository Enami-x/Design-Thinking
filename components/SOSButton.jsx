import React, { useEffect, useRef } from 'react';
import { TouchableOpacity, Animated, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SOSButton({ onPress }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ scale: pulse }] }]}>
      <TouchableOpacity style={styles.button} onPress={onPress} activeOpacity={0.85}>
        <Ionicons name="alert-circle" size={22} color="#fff" />
        <Text style={styles.label}>SOS</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', bottom: 156, right: 20 },
  button: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#ef4444',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#ef4444', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7, shadowRadius: 14, elevation: 12,
  },
  label: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
});
