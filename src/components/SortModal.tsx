import React from 'react';
import { Modal, View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SortModalProps {
  visible: boolean;
  onClose: () => void;
  sortBy: 'due_date' | 'created_at' | 'title';
  sortOrder: 'asc' | 'desc';
  onSelectSortBy: (field: 'due_date' | 'created_at' | 'title') => void;
  onSelectSortOrder: (order: 'asc' | 'desc') => void;
}

export function SortModal({
  visible,
  onClose,
  sortBy,
  sortOrder,
  onSelectSortBy,
  onSelectSortOrder,
}: SortModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        className="flex-1 bg-black/40 justify-end"
        activeOpacity={1}
        onPress={onClose}
      >
        <View className="bg-white rounded-t-2xl p-6 pb-8">
          <Text className="text-lg font-bold mb-4 text-black">Sort Tasks By</Text>

          <View className="h-[1px] bg-gray-200 my-2" />

          {/* Sort field options */}
          {(
            [
              { label: 'Created Date', value: 'created_at' },
              { label: 'Due Date', value: 'due_date' },
              { label: 'Title', value: 'title' },
            ] as const
          ).map((option) => (
            <TouchableOpacity
              key={option.value}
              className="flex-row justify-between items-center py-3"
              onPress={() => onSelectSortBy(option.value)}
            >
              <Text
                className={`text-base ${
                  sortBy === option.value ? 'text-emerald-500 font-bold' : 'text-gray-500'
                }`}
              >
                {option.label}
              </Text>
              {sortBy === option.value && (
                <Ionicons name="checkmark" size={18} color="#10b981" />
              )}
            </TouchableOpacity>
          ))}

          <View className="h-[1px] bg-gray-200 my-2" />

          <Text className="text-sm font-bold text-gray-400 mt-2 mb-1">Order</Text>

          {/* Sort order options */}
          {(
            [
              { label: 'Ascending', value: 'asc' },
              { label: 'Descending', value: 'desc' },
            ] as const
          ).map((option) => (
            <TouchableOpacity
              key={option.value}
              className="flex-row justify-between items-center py-3"
              onPress={() => onSelectSortOrder(option.value)}
            >
              <Text
                className={`text-base ${
                  sortOrder === option.value ? 'text-emerald-500 font-bold' : 'text-gray-500'
                }`}
              >
                {option.label}
              </Text>
              {sortOrder === option.value && (
                <Ionicons name="checkmark" size={18} color="#10b981" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}
