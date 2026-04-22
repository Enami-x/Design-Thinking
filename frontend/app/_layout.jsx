import React, { useEffect, useRef } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';

const T = {
  bg: '#080c10',
  nav: '#0d1520',
  navBorder: 'rgba(255,255,255,0.06)',
  teal: '#00d4b0',
  danger: '#ff3b5c',
  textActive: '#00d4b0',
  textInactive: '#3d556e',
};

function SOSTabButton({ onPress, children }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 1, duration: 900, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0.5, duration: 900, useNativeDriver: true }),
        ]),
      ])
    ).start();
  }, []);

  return (
    <TouchableOpacity onPress={onPress} style={styles.sosTabWrapper} activeOpacity={0.85}>
      {/* Outer glow ring */}
      <Animated.View style={[styles.sosGlowRing, { opacity: glow, transform: [{ scale: pulse }] }]} />
      {/* Button */}
      <Animated.View style={[styles.sosTabBtn, { transform: [{ scale: pulse }] }]}>
        <Ionicons name="alert-circle" size={26} color="#fff" />
        <Text style={styles.sosTabLabel}>SOS</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: styles.tabBar,
            tabBarActiveTintColor: T.textActive,
            tabBarInactiveTintColor: T.textInactive,
            tabBarShowLabel: true,
            tabBarLabelStyle: styles.tabLabel,
            tabBarItemStyle: styles.tabItem,
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: 'Map',
              tabBarIcon: ({ color, focused }) => (
                <View style={focused ? styles.activeIconWrap : null}>
                  <Ionicons name={focused ? 'map' : 'map-outline'} size={22} color={color} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="route-detail"
            options={{
              title: 'Route',
              tabBarIcon: ({ color, focused }) => (
                <View style={focused ? styles.activeIconWrap : null}>
                  <Ionicons name={focused ? 'navigate' : 'navigate-outline'} size={22} color={color} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="report"
            options={{
              title: '',
              tabBarButton: (props) => <SOSTabButton {...props} />,
            }}
          />
          <Tabs.Screen
            name="alerts"
            options={{
              title: 'Alerts',
              tabBarIcon: ({ color, focused }) => (
                <View style={focused ? styles.activeIconWrap : null}>
                  <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={22} color={color} />
                </View>
              ),
            }}
          />
          <Tabs.Screen
            name="sos"
            options={{
              title: 'Journey',
              tabBarIcon: ({ color, focused }) => (
                <View style={focused ? styles.activeIconWrap : null}>
                  <Ionicons name={focused ? 'shield-half' : 'shield-half-outline'} size={22} color={color} />
                </View>
              ),
            }}
          />
        </Tabs>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  tabBar: {
    backgroundColor: T.nav,
    borderTopColor: T.navBorder,
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 10,
    paddingTop: 8,
    elevation: 0,
  },
  tabItem: { paddingTop: 4 },
  tabLabel: { fontSize: 10, fontWeight: '600', letterSpacing: 0.3, marginTop: 2 },
  activeIconWrap: {
    backgroundColor: 'rgba(0,212,176,0.12)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sosTabWrapper: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    marginTop: -28,
  },
  sosGlowRing: {
    position: 'absolute',
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: T.danger,
    opacity: 0.3,
  },
  sosTabBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: T.danger,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: T.danger, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8, shadowRadius: 16, elevation: 16,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.15)',
  },
  sosTabLabel: { color: '#fff', fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 1 },
});
