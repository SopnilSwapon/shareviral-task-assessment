import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Keyboard,
  Platform,
  Text,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { tasksApi } from '../../api/tasksApi';
import { Category, CreateCategoryInput } from '../../types';
import { OfflineBanner } from '../../components/OfflineBanner';
import { getCategoryColor } from '../../utils/colors';

export default function CategoriesScreen() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const { data: categories = [], isLoading, isFetching } = useQuery({
    queryKey: ['categories'],
    queryFn: tasksApi.fetchCategories,
  });

  const createCategoryMutation = useMutation({
    mutationFn: (categoryData: CreateCategoryInput) => tasksApi.createCategory(categoryData),
    onSuccess: (newCategory) => {
      queryClient.setQueryData<Category[]>(['categories'], (old) =>
        old ? [...old, newCategory].sort((a, b) => a.name.localeCompare(b.name)) : [newCategory]
      );
      setName('');
      Keyboard.dismiss();
    },
    onError: (err) => {
      Alert.alert('Error', 'Could not create category on the remote server: ' + err.message);
    },
  });

  const handleCreate = () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Category name is required.');
      return;
    }
    createCategoryMutation.mutate({
      name: name.trim(),
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <OfflineBanner />

      <View className="flex-1 p-4 gap-4">
        {/* Form Container */}
        <View className="p-4 rounded-xl gap-2 bg-slate-50 shadow-sm border border-gray-100">
          <Text className="text-base font-bold text-black">Add New Category</Text>

          <View className="flex-row gap-2 mt-1">
            <TextInput
              placeholder="Category name..."
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              className="flex-1 h-11 rounded-lg px-3 bg-white text-base text-black border border-gray-200"
              testID="category-name-input"
            />
            <TouchableOpacity
              className="w-11 h-11 rounded-lg justify-center items-center bg-black active:opacity-70"
              onPress={handleCreate}
              disabled={createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="add" size={24} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories List */}
        <View className="flex-1 gap-2">
          <View className="flex-row items-center justify-between px-1">
            <Text className="text-base font-bold text-black">All Categories</Text>
            {isFetching && !isLoading && (
              <ActivityIndicator size="small" color="#000000" />
            )}
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color="#000000" className="mt-10" />
          ) : categories.length === 0 ? (
            <View className="flex-1 justify-center items-center pb-10">
              <Ionicons name="folder-outline" size={48} color="#9ca3af" />
              <Text className="text-sm mt-4 text-gray-400">
                No categories created yet.
              </Text>
            </View>
          ) : (
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item }) => {
                const catColor = getCategoryColor(item.name);
                return (
                  <View className="flex-row justify-between items-center p-3 rounded-lg mb-2 bg-slate-50 border border-gray-100 shadow-sm">
                    <View className="flex-row items-center gap-2">
                      <View style={{ backgroundColor: catColor }} className="w-3 h-3 rounded-full" />
                      <Text className="text-[15px] font-semibold text-black">{item.name}</Text>
                    </View>
                    <Text
                      style={{
                        fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
                      }}
                      className="text-xs text-gray-400"
                    >
                      {catColor}
                    </Text>
                  </View>
                );
              }}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
