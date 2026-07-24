import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Text, View } from 'react-native';

interface ISyncStatusHeaderProps {
  isOnline: boolean;
  syncStatusText: string;
  isFetching: boolean;
  isLoading: boolean;
}

export function SyncStatusHeader({
  isOnline,
  syncStatusText,
  isFetching,
  isLoading,
}: ISyncStatusHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-100 bg-white">
      <View className="flex-row items-center gap-1.5">
        <Ionicons
          name={isOnline ? 'cloud-done-outline' : 'cloud-offline-outline'}
          size={16}
          color={isOnline ? '#10b981' : '#f59e0b'}
        />
        <Text className="text-xs text-gray-500">
          {syncStatusText}
        </Text>
      </View>
      {(isFetching || isLoading) && (
        <ActivityIndicator size="small" color="#000000" className="mr-1" />
      )}
    </View>
  );
}
