/**
 * Network Status Monitor
 * Displays a banner when the user is offline
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors } from '../constants/theme';

export const NetworkStatus: React.FC = () => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Web only: use navigator.onLine
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      setIsConnected(window.navigator.onLine);

      const handleOnline = () => setIsConnected(true);
      const handleOffline = () => setIsConnected(false);

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }

    // For native, you would use @react-native-community/netinfo
    // Skipping for now to avoid adding dependencies
    // You can install it later if needed:
    // npm install @react-native-community/netinfo
    
    // import NetInfo from '@react-native-community/netinfo';
    // const unsubscribe = NetInfo.addEventListener(state => {
    //   setIsConnected(state.isConnected ?? false);
    // });
    // return unsubscribe;
  }, []);

  if (isConnected) {
    return null;
  }

  return (
    <View style={styles.banner}>
      <Text style={styles.bannerText}>⚠️ No internet connection</Text>
      <Text style={styles.bannerSubtext}>
        Some features may not work properly
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.danger,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  bannerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bannerSubtext: {
    color: '#FFFFFF',
    fontSize: 12,
    marginTop: 4,
    opacity: 0.9,
  },
});


