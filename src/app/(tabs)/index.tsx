import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigation } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OfflineBanner } from '../../components/OfflineBanner';
import { TaskItem } from '../../components/TaskItem';
import { QK_CATEGORIES, QK_TASKS } from '../../hooks/queryKeys';
import { useAppMutation } from '../../hooks/useAppMutation';
import { useAppQuery } from '../../hooks/useAppQuery';
import { useDebounce } from '../../hooks/useDebounce';
import { useFilteredSortedTasks } from '../../hooks/useFilteredSortedTasks';
import { useAppStore } from '../../store/useAppStore';
import { Category, CreateTaskInput, Task } from '../../types';
import { getCategoryColor } from '../../utils/colors';
import { mergeRemoteWithLocalStarred } from '../../utils/merge';

type TTaskFormValues = {
  title: string;
  description: string;
  category_id: string | null;
  due_date: string;
};

export default function TasksScreen() {
  const queryClient = useQueryClient();
  const navigation = useNavigation();

  // Local UI state
  const [localSearch, setLocalSearch] = useState('');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [isSortModalVisible, setIsSortModalVisible] = useState(false);

  // React Hook Form
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

  // Queries using useAppQuery
  const { data: categories = [] } = useAppQuery<Category[]>({
    queryKey: [QK_CATEGORIES],
    url: '/categories?select=*&order=name.asc',
  });

  const {
    data: tasks = [],
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useAppQuery<Task[]>({
    queryKey: [QK_TASKS],
    url: '/tasks?select=*&order=created_at.desc',
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

  // Mutations using useAppMutation
  const toggleCompleteMutation = useAppMutation<Task, { id: string; completed: boolean }>({
    method: 'PATCH',
    url: ({ id }) => `/tasks?id=eq.${id}`,
    silent: true,
    onSuccess: (response) => {
      queryClient.setQueryData<Task[]>([QK_TASKS], (old) =>
        old ? old.map((t) => (t.id === response.data.id ? response.data : t)) : []
      );
    },
    onError: (err: any) => {
      Alert.alert('Sync Error', 'Could not update task: ' + err.message);
    },
  });

  const createTaskMutation = useAppMutation<Task, CreateTaskInput>({
    method: 'POST',
    url: '/tasks',
    silent: true,
    onSuccess: (response) => {
      queryClient.setQueryData<Task[]>([QK_TASKS], (old) =>
        old ? [response.data, ...old] : [response.data]
      );
      reset();
      setIsCreateModalVisible(false);
    },
    onError: (err: any) => {
      Alert.alert('Sync Error', 'Could not save task: ' + err.message);
    },
  });

  const handleToggleComplete = (id: string, completed: boolean) => {
    toggleCompleteMutation.mutate({ id, completed });
  };

  const handleToggleStarred = (id: string) => {
    toggleStarredTask(id);
  };

  const onSubmit = (values: TTaskFormValues) => {
    const payload: CreateTaskInput = {
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      category_id: values.category_id,
      due_date: values.due_date ? new Date(values.due_date).toISOString() : null,
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
          <View className="items-center justify-center pt-24">
            <Ionicons name="document-text-outline" size={64} color="#9ca3af" />
            <Text className="text-lg font-bold mt-4 text-gray-400">
              No tasks found.
            </Text>
            <Text className="text-sm text-center mt-1 text-gray-400">
              Try adjusting filters or create a new task.
            </Text>
          </View>
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
        onPress={() => {
          reset();
          setIsCreateModalVisible(true);
        }}
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
            <TouchableOpacity onPress={handleSubmit(onSubmit)}>
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
    </SafeAreaView>
  );
}
