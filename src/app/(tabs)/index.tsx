import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Text,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';

import { tasksApi } from '../../api/tasksApi';
import { useAppStore } from '../../store/useAppStore';
import { mergeRemoteWithLocalStarred } from '../../utils/merge';
import { useFilteredSortedTasks } from '../../hooks/useFilteredSortedTasks';
import { useDebounce } from '../../hooks/useDebounce';
import { TaskItem } from '../../components/TaskItem';
import { OfflineBanner } from '../../components/OfflineBanner';
import { Task, CreateTaskInput } from '../../types';
import { getCategoryColor } from '../../utils/colors';

export default function TasksScreen() {
  const queryClient = useQueryClient();
  const navigation = useNavigation();

  // Local UI state
  const [localSearch, setLocalSearch] = useState('');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);

  // Task Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategoryId, setNewCategoryId] = useState<string | null>(null);
  const [newDueDate, setNewDueDate] = useState('');

  // Zustand Store state
  const {
    categoryId,
    statusFilter,
    sortBy,
    sortOrder,
    starredTaskIds,
    isOnline,
    lastSyncTimestamp,
    setSearchQuery,
    setCategoryId,
    setStatusFilter,
    setSortBy,
    setSortOrder,
    toggleStarredTask,
    setLastSyncTimestamp,
  } = useAppStore();

  // Debounce search by 300ms
  const debouncedSearch = useDebounce(localSearch, 300);

  // Sync debounced search to Zustand store
  useEffect(() => {
    setSearchQuery(debouncedSearch);
  }, [debouncedSearch, setSearchQuery]);

  // Queries
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: tasksApi.fetchCategories,
  });

  const {
    data: tasks = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['tasks'],
    queryFn: tasksApi.fetchTasks,
    select: (data) => mergeRemoteWithLocalStarred(data, starredTaskIds),
  });

  // Dynamically set manual refresh button in header top right
  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => refetch()}
          className="pr-4 justify-center items-center active:opacity-60"
          testID="manual-refresh-button"
        >
          <Ionicons name="refresh" size={22} color="#000000" />
        </TouchableOpacity>
      ),
    });
  }, [navigation, refetch]);

  // Track sync status
  useEffect(() => {
    if (!isFetching && !isLoading && !isError) {
      setLastSyncTimestamp(Date.now());
    }
  }, [isFetching, isLoading, isError, setLastSyncTimestamp]);

  // Hook for filtering and sorting
  const filteredSortedTasks = useFilteredSortedTasks(
    tasks,
    debouncedSearch,
    categoryId,
    statusFilter,
    sortBy,
    sortOrder
  );

  // Mutations
  const toggleCompleteMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      tasksApi.updateTask(id, { status: completed ? 'done' : 'open' }),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<Task[]>(['tasks'], (old) =>
        old ? old.map((t) => (t.id === updatedTask.id ? updatedTask : t)) : []
      );
    },
    onError: (err) => {
      Alert.alert('Sync Error', 'Could not update task on remote server: ' + err.message);
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (taskData: CreateTaskInput) => tasksApi.createTask(taskData),
    onSuccess: (createdTask) => {
      queryClient.setQueryData<Task[]>(['tasks'], (old) =>
        old ? [createdTask, ...old] : [createdTask]
      );
      resetForm();
      setIsCreateModalVisible(false);
    },
    onError: (err) => {
      Alert.alert('Sync Error', 'Could not save task to remote server: ' + err.message);
    },
  });

  const resetForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewCategoryId(null);
    setNewDueDate('');
  };

  const handleToggleComplete = (id: string, completed: boolean) => {
    toggleCompleteMutation.mutate({ id, completed });
  };

  const handleToggleStarred = (id: string) => {
    toggleStarredTask(id);
  };

  const handleCreateTask = () => {
    if (!newTitle.trim()) {
      Alert.alert('Validation Error', 'Task title is required.');
      return;
    }
    const payload: CreateTaskInput = {
      title: newTitle.trim(),
      description: newDescription.trim() || undefined,
      category_id: newCategoryId,
      due_date: newDueDate ? new Date(newDueDate).toISOString() : null,
      status: 'open',
    };
    createTaskMutation.mutate(payload);
  };

  // Helper for sync status string
  const getSyncStatusText = () => {
    if (isLoading) return 'Loading...';
    if (isFetching) return 'Refreshing...';
    if (lastSyncTimestamp) {
      const time = new Date(lastSyncTimestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      return `Synced at ${time}`;
    }
    return 'Not synced';
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <OfflineBanner />

      {/* Header Info Panel */}
      <View className="flex-row items-center justify-between px-4 py-2 border-b border-gray-100">
        <View className="flex-row items-center gap-1.5">
          <Ionicons
            name={isOnline ? 'cloud-done-outline' : 'cloud-offline-outline'}
            size={16}
            color={isOnline ? '#10b981' : '#f59e0b'}
          />
          <Text className="text-xs text-gray-500">
            {getSyncStatusText()}
          </Text>
        </View>
        {(isFetching || isLoading) && (
          <ActivityIndicator size="small" color="#000000" className="mr-1" />
        )}
      </View>

      {/* Filter / Search section */}
      <View className="pt-2 pb-1">
        {/* Search Bar */}
        <View className="flex-row items-center mx-4 px-3 rounded-lg h-10 mb-3 bg-gray-100">
          <Ionicons name="search" size={20} color="#9ca3af" className="mr-2" />
          <TextInput
            placeholder="Search tasks..."
            placeholderTextColor="#9ca3af"
            value={localSearch}
            onChangeText={setLocalSearch}
            className="flex-1 text-sm font-medium text-black p-0"
            testID="search-input"
          />
          {localSearch.length > 0 && (
            <TouchableOpacity onPress={() => setLocalSearch('')} className="p-1">
              <Ionicons name="close-circle" size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filters */}
        <View className="flex-row items-center mx-4 mb-3 gap-2">
          {(['all', 'open', 'completed'] as const).map((filter) => {
            const isActive = statusFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={{ backgroundColor: isActive ? '#e5e7eb' : 'transparent' }}
                className="flex-1 h-8 items-center justify-center rounded-lg"
                onPress={() => setStatusFilter(filter)}
              >
                <Text
                  className={`text-[13px] font-semibold ${
                    isActive ? 'text-black font-bold' : 'text-gray-500'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}

          {/* Sort trigger button */}
          <TouchableOpacity
            className="flex-row items-center justify-center px-3 h-8 rounded-lg gap-1 bg-gray-100"
            onPress={() => setIsSortModalVisible(true)}
          >
            <Ionicons name="funnel-outline" size={16} color="#000000" />
            <Text className="text-xs font-semibold text-black">Sort</Text>
          </TouchableOpacity>
        </View>

        {/* Category Chips Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8 }}
        >
          <TouchableOpacity
            style={{ backgroundColor: categoryId === null ? '#000000' : 'transparent' }}
            className="px-3 py-1.5 rounded-full justify-center items-center border border-gray-200"
            onPress={() => setCategoryId(null)}
          >
            <Text
              className={`text-xs font-medium ${
                categoryId === null ? 'text-white font-bold' : 'text-black'
              }`}
            >
              All Categories
            </Text>
          </TouchableOpacity>

          {categories.map((cat) => {
            const isSelected = categoryId === cat.id;
            const catColor = getCategoryColor(cat.name);
            return (
              <TouchableOpacity
                key={cat.id}
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: catColor,
                  backgroundColor: isSelected ? catColor : 'transparent',
                }}
                className="px-3 py-1.5 rounded-full justify-center items-center border border-gray-200"
                onPress={() => setCategoryId(isSelected ? null : cat.id)}
              >
                <Text
                  className={`text-xs font-medium ${
                    isSelected ? 'text-white font-bold' : 'text-black'
                  }`}
                >
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Task List */}
      {isLoading && tasks.length === 0 ? (
        <View className="flex-1 justify-center items-center gap-4">
          <ActivityIndicator size="large" color="#000000" />
        </View>
      ) : isError && tasks.length === 0 ? (
        <View className="flex-1 justify-center items-center gap-4">
          <Ionicons name="warning-outline" size={48} color="#ef4444" />
          <Text className="text-base font-semibold color-red-500">Failed to load tasks</Text>
          <TouchableOpacity
            className="py-2 px-4 rounded-lg bg-black"
            onPress={() => refetch()}
          >
            <Text className="text-white">Retry</Text>
          </TouchableOpacity>
        </View>
      ) : filteredSortedTasks.length === 0 ? (
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 40 }}
          refreshControl={
            <FlatList
              data={[]}
              renderItem={null}
              refreshing={isFetching}
              onRefresh={refetch}
              style={{ display: 'none' }}
            />
          }
        >
          <Ionicons name="document-text-outline" size={64} color="#9ca3af" />
          <Text className="text-lg font-bold mt-4 text-gray-400">
            No tasks found.
          </Text>
          <Text className="text-sm text-center mt-1 text-gray-400">
            Try adjusting filters or create a new task.
          </Text>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredSortedTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120 }}
          refreshing={isFetching}
          onRefresh={refetch}
          renderItem={({ item }) => {
            const category = categories.find((cat) => cat.id === item.category_id);
            return (
              <TaskItem
                task={item}
                category={category}
                onToggleComplete={handleToggleComplete}
                onToggleStarred={handleToggleStarred}
              />
            );
          }}
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute right-6 bottom-6 w-14 h-14 rounded-full justify-center items-center bg-black shadow-lg"
        onPress={() => setIsCreateModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#ffffff" />
      </TouchableOpacity>

      {/* Sort Options Modal */}
      <Modal
        visible={isSortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSortModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/40 justify-end"
          activeOpacity={1}
          onPress={() => setIsSortModalVisible(false)}
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
                onPress={() => setSortBy(option.value)}
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
                onPress={() => setSortOrder(option.value)}
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

      {/* Create Task Modal */}
      <Modal
        visible={isCreateModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsCreateModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 bg-white"
        >
          <View className="flex-row justify-between items-center px-4 py-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
              <Text className="text-red-500 text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-black">New Task</Text>
            <TouchableOpacity onPress={handleCreateTask}>
              <Text className="text-emerald-500 text-base font-bold">Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
            <View className="gap-1">
              <Text className="text-sm font-bold text-black">Title *</Text>
              <TextInput
                placeholder="Enter task title"
                placeholderTextColor="#9ca3af"
                value={newTitle}
                onChangeText={setNewTitle}
                className="h-11 rounded-lg px-3 text-base text-black bg-gray-100"
              />
            </View>

            <View className="gap-1">
              <Text className="text-sm font-bold text-black">Description</Text>
              <TextInput
                placeholder="Enter description"
                placeholderTextColor="#9ca3af"
                value={newDescription}
                onChangeText={setNewDescription}
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
                  style={{ backgroundColor: newCategoryId === null ? '#000000' : '#f3f4f6' }}
                  className="px-4 py-2 rounded-lg"
                  onPress={() => setNewCategoryId(null)}
                >
                  <Text
                    className={`text-[13px] font-semibold ${
                      newCategoryId === null ? 'text-white' : 'text-black'
                    }`}
                  >
                    None
                  </Text>
                </TouchableOpacity>

                {categories.map((cat) => {
                  const isSel = newCategoryId === cat.id;
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
                      onPress={() => setNewCategoryId(cat.id)}
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
                value={newDueDate}
                onChangeText={setNewDueDate}
                className="h-11 rounded-lg px-3 text-base text-black bg-gray-100"
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
