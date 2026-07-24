import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ThemedText } from './themed-text';
import { useAppStore } from '../store/useAppStore';

export function OfflineBanner() {
  const isOnline = useAppStore((state) => state.isOnline);

  if (isOnline) return null;

  return (
    <View style={styles.banner}>
      <ThemedText style={styles.text}>
        ⚠️ Offline Mode. Showing cached data.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#f59e0b', // Amber/orange color for offline indicator
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  text: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 13,
  },
});
