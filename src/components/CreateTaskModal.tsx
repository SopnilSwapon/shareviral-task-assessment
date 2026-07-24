import React from 'react';
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../types';
import { getCategoryColor } from '../utils/colors';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  categories: Category[];
  onSubmit: (payload: {
    title: string;
    description: string;
    category_id: string | null;
    due_date: string;
  }) => void;
  isPending: boolean;
}

type TTaskFormValues = {
  title: string;
  description: string;
  category_id: string | null;
  due_date: string;
};

export function CreateTaskModal({
  visible,
  onClose,
  categories,
  onSubmit,
  isPending,
}: CreateTaskModalProps) {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TTaskFormValues>({
    defaultValues: {
      title: '',
      description: '',
      category_id: null,
      due_date: '',
    },
  });

  const selectedCategoryId = watch('category_id');

  const handleSave = (values: TTaskFormValues) => {
    onSubmit(values);
  };

  const handleCancel = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white"
      >
        <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-200">
          <TouchableOpacity onPress={handleCancel}>
            <Text className="text-red-500 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-lg font-bold text-black">New Task</Text>
          <TouchableOpacity onPress={handleSubmit(handleSave)} disabled={isPending}>
            <Text className="text-emerald-500 text-base font-bold">Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
          <View className="gap-1">
            <Text className="text-sm font-bold text-black">Title *</Text>
            <Controller
              control={control}
              name="title"
              rules={{
                required: 'Task title is required',
                validate: (value) => value.trim().length > 0 || 'Task title is required',
              }}
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  placeholder="Enter task title"
                  placeholderTextColor="#9ca3af"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  className={`h-11 rounded-lg px-3 text-base text-black bg-gray-100 border ${
                    errors.title ? 'border-red-500' : 'border-transparent'
                  }`}
                />
              )}
            />
            {errors.title && (
              <Text className="text-red-500 text-xs pl-1">
                {errors.title.message}
              </Text>
            )}
          </View>

          <View className="gap-1">
            <Text className="text-sm font-bold text-black">Description</Text>
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  placeholder="Enter description"
                  placeholderTextColor="#9ca3af"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  multiline
                  numberOfLines={3}
                  className="h-24 rounded-lg px-3 py-2 text-base text-black bg-gray-100 border border-transparent"
                  style={{ textAlignVertical: 'top' }}
                />
              )}
            />
          </View>

          <View className="gap-1">
            <Text className="text-sm font-bold text-black">Category</Text>
            <View className="flex-row flex-wrap gap-2 py-1">
              <TouchableOpacity
                style={{ backgroundColor: selectedCategoryId === null ? '#000000' : '#f3f4f6' }}
                className="px-4 py-2 rounded-lg"
                onPress={() => setValue('category_id', null)}
              >
                <Text
                  className={`text-[13px] font-semibold ${
                    selectedCategoryId === null ? 'text-white' : 'text-black'
                  }`}
                >
                  None
                </Text>
              </TouchableOpacity>

              {categories.map((cat) => {
                const isSel = selectedCategoryId === cat.id;
                const catColor = getCategoryColor(cat.name);
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={{
                      borderLeftColor: catColor,
                      borderLeftWidth: 3,
                      backgroundColor: isSel ? catColor : '#f3f4f6',
                    }}
                    className="px-4 py-2 rounded-lg"
                    onPress={() => setValue('category_id', isSel ? null : cat.id)}
                  >
                    <Text
                      className={`text-[13px] font-semibold ${
                        isSel ? 'text-white font-bold' : 'text-black'
                      }`}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View className="gap-1">
            <Text className="text-sm font-bold text-black">Due Date (YYYY-MM-DD)</Text>
            <Controller
              control={control}
              name="due_date"
              render={({ field: { onChange, value, onBlur } }) => (
                <TextInput
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#9ca3af"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  className="h-11 rounded-lg px-3 text-base text-black bg-gray-100 border border-transparent"
                />
              )}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
