import React from 'react';
import { View, Text } from 'react-native';
import { useAppStore } from '../store/useAppStore';

export function OfflineBanner() {
  const isOnline = useAppStore((state) => state.isOnline);

  if (isOnline) return null;

  return (
    <View className="bg-amber-500 py-2 px-4 items-center justify-center w-full">
      <Text className="text-black font-bold text-[13px]">
        ⚠️ Offline Mode. Showing cached data.
      </Text>
    </View>
  );
}
