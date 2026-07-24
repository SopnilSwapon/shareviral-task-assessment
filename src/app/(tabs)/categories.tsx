import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OfflineBanner } from '../../components/OfflineBanner';
import { QK_CATEGORIES } from '../../hooks/queryKeys';
import { useAppMutation } from '../../hooks/useAppMutation';
import { useAppQuery } from '../../hooks/useAppQuery';
import { Category, CreateCategoryInput } from '../../types';
import { getCategoryColor } from '../../utils/colors';

type TCategoryFormValues = {
  name: string;
};

export default function CategoriesScreen() {
  const queryClient = useQueryClient();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TCategoryFormValues>({
    defaultValues: { name: '' },
  });

  const { data: categories = [], isLoading, isFetching } = useAppQuery<Category[]>({
    queryKey: [QK_CATEGORIES],
    url: '/categories?select=*&order=name.asc',
  });

  const createCategoryMutation = useAppMutation<Category, CreateCategoryInput>({
    method: 'POST',
    url: '/categories',
    silent: true,
    onSuccess: (response) => {
      queryClient.setQueryData<Category[]>([QK_CATEGORIES], (old) =>
        old ? [...old, response.data].sort((a, b) => a.name.localeCompare(b.name)) : [response.data]
      );
      reset();
      Keyboard.dismiss();
    },
    onError: (err: any) => {
      Alert.alert('Error', 'Could not create category: ' + (err.message || 'Something went wrong.'));
    },
  });

  const onSubmit = (values: TCategoryFormValues) => {
    createCategoryMutation.mutate({
      name: values.name.trim(),
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <OfflineBanner />

      <View className="flex-1 p-4 gap-4">
        {/* Form Container */}
        <View className="p-4 rounded-xl gap-2 bg-slate-50 shadow-sm border border-gray-100">
          <Text className="text-base font-bold text-black">Add New Category</Text>

          <View className="flex-row gap-2 mt-1 items-start">
            <View className="flex-1">
              <Controller
                control={control}
                name="name"
                rules={{
                  required: 'Category name is required',
                  validate: (value) => value.trim().length > 0 || 'Category name is required',
                }}
                render={({ field: { onChange, value, onBlur } }) => (
                  <TextInput
                    placeholder="Category name..."
                    placeholderTextColor="#9ca3af"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    className={`h-11 rounded-lg px-3 bg-white text-base text-black border ${
                      errors.name ? 'border-red-500' : 'border-gray-200'
                    }`}
                    testID="category-name-input"
                  />
                )}
              />
              {errors.name && (
                <Text className="text-red-500 text-xs mt-1 pl-1" testID="category-name-error">
                  {errors.name.message}
                </Text>
              )}
            </View>

            <TouchableOpacity
              className="w-11 h-11 rounded-lg justify-center items-center bg-black active:opacity-70"
              onPress={handleSubmit(onSubmit)}
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
