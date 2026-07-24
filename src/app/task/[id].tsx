import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { tasksApi } from '../../api/tasksApi';
import { useAppStore } from '../../store/useAppStore';
import { Task, Category, UpdateTaskInput } from '../../types';
import { OfflineBanner } from '../../components/OfflineBanner';
import { getCategoryColor } from '../../utils/colors';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Zustand Store
  const { starredTaskIds, toggleStarredTask, removeStarredTask } = useAppStore();

  // Modal / Edit States
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editDueDate, setEditDueDate] = useState('');

  // Fetch cached tasks and categories
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['tasks'],
    queryFn: tasksApi.fetchTasks,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: tasksApi.fetchCategories,
  });

  const task = tasks.find((t) => t.id === id);
  const isStarred = starredTaskIds.includes(id || '');
  const category = categories.find((c) => c.id === task?.category_id);
  const categoryColor = getCategoryColor(category?.name);
  const isCompleted = task?.status === 'done';

  // Mutations
  const updateTaskMutation = useMutation({
    mutationFn: (updates: UpdateTaskInput) => tasksApi.updateTask(id || '', updates),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<Task[]>(['tasks'], (old) =>
        old ? old.map((t) => (t.id === updatedTask.id ? updatedTask : t)) : []
      );
      setIsEditModalVisible(false);
    },
    onError: (err) => {
      Alert.alert('Update Failed', 'Could not sync updates to server: ' + err.message);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: () => tasksApi.deleteTask(id || ''),
    onSuccess: () => {
      queryClient.setQueryData<Task[]>(['tasks'], (old) =>
        old ? old.filter((t) => t.id !== id) : []
      );
      removeStarredTask(id || '');
      router.back();
    },
    onError: (err) => {
      Alert.alert('Delete Failed', 'Could not delete task from server: ' + err.message);
    },
  });

  const handleToggleComplete = () => {
    if (!task) return;
    const nextStatus = task.status === 'done' ? 'open' : 'done';
    updateTaskMutation.mutate({ status: nextStatus });
  };

  const handleOpenEdit = () => {
    if (!task) return;
    setEditTitle(task.title);
    setEditDescription(task.description || '');
    setEditCategoryId(task.category_id);
    setEditDueDate(
      task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''
    );
    setIsEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editTitle.trim()) {
      Alert.alert('Validation Error', 'Task title is required.');
      return;
    }
    const updates: UpdateTaskInput = {
      title: editTitle.trim(),
      description: editDescription.trim() || '',
      category_id: editCategoryId,
      due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
    };
    updateTaskMutation.mutate(updates);
  };

  const handleDeleteConfirm = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to permanently delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteTaskMutation.mutate() },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#000000" />
      </View>
    );
  }

  if (!task) {
    return (
      <View className="flex-1 justify-center items-center bg-white gap-4">
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="text-lg font-bold color-red-500">Task not found</Text>
        <TouchableOpacity className="bg-gray-500 py-2 px-4 rounded-lg mt-2" onPress={() => router.back()}>
          <Text className="text-white">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const formattedDueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'No due date';

  return (
    <SafeAreaView className="flex-1 bg-white">
      <OfflineBanner />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* Category Label */}
        {category && (
          <View style={{ backgroundColor: categoryColor + '15' }} className="flex-row items-center py-1 px-3 rounded self-start gap-1.5 mb-2">
            <View style={{ backgroundColor: categoryColor }} className="w-2 h-2 rounded-full" />
            <Text style={{ color: categoryColor }} className="text-xs font-bold uppercase">
              {category.name}
            </Text>
          </View>
        )}

        {/* Title & Star Row */}
        <View className="flex-row justify-between items-start gap-4 mb-3">
          <Text className={`text-2xl font-bold flex-1 text-black ${isCompleted ? 'line-through opacity-60' : ''}`}>
            {task.title}
          </Text>
          <TouchableOpacity
            className="p-1"
            onPress={() => toggleStarredTask(task.id)}
            testID="detail-star-button"
          >
            <Ionicons
              name={isStarred ? 'star' : 'star-outline'}
              size={28}
              color={isStarred ? '#f59e0b' : '#9ca3af'}
            />
          </TouchableOpacity>
        </View>

        {/* Date Row */}
        <View className="flex-row items-center gap-3 py-3 border-b border-gray-100">
          <Ionicons name="calendar-outline" size={20} color="#9ca3af" />
          <View>
            <Text className="text-xs font-semibold text-gray-400 mb-0.5">
              Due Date
            </Text>
            <Text className="text-base font-semibold text-black">{formattedDueDate}</Text>
          </View>
        </View>

        {/* Status Row */}
        <View className="flex-row items-center gap-3 py-3 border-b border-gray-100">
          <Ionicons
            name={isCompleted ? 'checkmark-circle-outline' : 'ellipse-outline'}
            size={20}
            color={isCompleted ? '#10b981' : '#9ca3af'}
          />
          <View>
            <Text className="text-xs font-semibold text-gray-400 mb-0.5">
              Status
            </Text>
            <Text className="text-base font-semibold text-black">
              {isCompleted ? 'Completed' : 'In Progress'}
            </Text>
          </View>
        </View>

        {/* Description Section */}
        <View className="mt-3 gap-2">
          <Text className="text-xs font-bold text-gray-400 uppercase">
            Description
          </Text>
          <Text className="text-base leading-6 text-black">
            {task.description || 'No description provided.'}
          </Text>
        </View>

        {/* Actions Button Group */}
        <View className="mt-8 gap-3">
          <TouchableOpacity
            className={`flex-row h-12 rounded-lg justify-center items-center gap-2 ${
              isCompleted ? 'bg-gray-100' : 'bg-emerald-500'
            }`}
            onPress={handleToggleComplete}
            disabled={updateTaskMutation.isPending}
            testID="detail-complete-button"
          >
            {updateTaskMutation.isPending ? (
              <ActivityIndicator size="small" color={isCompleted ? '#000000' : '#ffffff'} />
            ) : (
              <>
                <Ionicons
                  name={isCompleted ? 'close-circle-outline' : 'checkmark-circle-outline'}
                  size={20}
                  color={isCompleted ? '#000000' : '#ffffff'}
                />
                <Text
                  className={`text-base font-bold ${
                    isCompleted ? 'text-black' : 'text-white'
                  }`}
                >
                  {isCompleted ? 'Mark Open' : 'Mark Completed'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row h-12 rounded-lg justify-center items-center gap-2 bg-gray-100"
            onPress={handleOpenEdit}
          >
            <Ionicons name="create-outline" size={20} color="#000000" />
            <Text className="text-base font-bold text-black">
              Edit Task
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row h-12 rounded-lg justify-center items-center gap-2 bg-red-500"
            onPress={handleDeleteConfirm}
            disabled={deleteTaskMutation.isPending}
          >
            {deleteTaskMutation.isPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color="#ffffff" />
                <Text className="text-base font-bold text-white">
                  Delete Task
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Task Modal */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-white"
        >
          <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
              <Text className="text-red-500 text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-black">Edit Task</Text>
            <TouchableOpacity onPress={handleSaveEdit}>
              <Text className="text-emerald-500 text-base font-bold">Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            <View className="gap-1">
              <Text className="text-sm font-bold text-black">Title *</Text>
              <TextInput
                placeholder="Enter task title"
                placeholderTextColor="#9ca3af"
                value={editTitle}
                onChangeText={setEditTitle}
                className="h-11 rounded-lg px-3 text-base text-black bg-gray-100"
              />
            </View>

            <View className="gap-1">
              <Text className="text-sm font-bold text-black">Description</Text>
              <TextInput
                placeholder="Enter description"
                placeholderTextColor="#9ca3af"
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
                numberOfLines={3}
                className="h-24 rounded-lg px-3 py-2 text-base text-black bg-gray-100"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            <View className="gap-1">
              <Text className="text-sm font-bold text-black">Category</Text>
              <View className="flex-row flex-wrap gap-2 py-1">
                <TouchableOpacity
                  style={{ backgroundColor: editCategoryId === null ? '#000000' : '#f3f4f6' }}
                  className="px-4 py-2 rounded-lg"
                  onPress={() => setEditCategoryId(null)}
                >
                  <Text
                    className={`text-[13px] font-semibold ${
                      editCategoryId === null ? 'text-white' : 'text-black'
                    }`}
                  >
                    None
                  </Text>
                </TouchableOpacity>

                {categories.map((cat) => {
                  const isSel = editCategoryId === cat.id;
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
                      onPress={() => setEditCategoryId(cat.id)}
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
              <TextInput
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9ca3af"
                value={editDueDate}
                onChangeText={setEditDueDate}
                className="h-11 rounded-lg px-3 text-base text-black bg-gray-100"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
