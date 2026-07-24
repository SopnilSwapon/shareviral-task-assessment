import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  useColorScheme,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { tasksApi } from '../../api/tasksApi';
import { useAppStore } from '../../store/useAppStore';
import { mergeRemoteWithLocalStarred } from '../../utils/merge';
import { useFilteredSortedTasks } from '../../hooks/useFilteredSortedTasks';
import { useDebounce } from '../../hooks/useDebounce';
import { TaskItem } from '../../components/TaskItem';
import { OfflineBanner } from '../../components/OfflineBanner';
import { ThemedText } from '../../components/themed-text';
import { Colors, Spacing } from '../../constants/theme';
import { Task, CreateTaskInput } from '../../types';
import { getCategoryColor } from '../../utils/colors';

export default function TasksScreen() {
  const scheme = useColorScheme();
  const themeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];
  const queryClient = useQueryClient();

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <OfflineBanner />

      {/* Header Info Panel */}
      <View style={[styles.syncStatusHeader, { borderBottomColor: themeColors.backgroundElement }]}>
        <View style={styles.syncStatusLeft}>
          <Ionicons
            name={isOnline ? 'cloud-done-outline' : 'cloud-offline-outline'}
            size={16}
            color={isOnline ? '#10b981' : '#f59e0b'}
          />
          <ThemedText style={[styles.syncText, { color: themeColors.textSecondary }]}>
            {getSyncStatusText()}
          </ThemedText>
        </View>
        {(isFetching || isLoading) && (
          <ActivityIndicator size="small" color={themeColors.text} style={styles.syncSpinner} />
        )}
      </View>

      {/* Filter / Search section */}
      <View style={styles.filterSection}>
        {/* Search Bar */}
        <View style={[styles.searchContainer, { backgroundColor: themeColors.backgroundElement }]}>
          <Ionicons name="search" size={20} color={themeColors.textSecondary} style={styles.searchIcon} />
          <TextInput
            placeholder="Search tasks..."
            placeholderTextColor={themeColors.textSecondary}
            value={localSearch}
            onChangeText={setLocalSearch}
            style={[styles.searchInput, { color: themeColors.text }]}
            testID="search-input"
          />
          {localSearch.length > 0 && (
            <TouchableOpacity onPress={() => setLocalSearch('')} style={styles.clearSearch}>
              <Ionicons name="close-circle" size={18} color={themeColors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Status Filters */}
        <View style={styles.statusFilters}>
          {(['all', 'open', 'completed'] as const).map((filter) => {
            const isActive = statusFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.statusTab,
                  isActive && { backgroundColor: themeColors.backgroundSelected },
                ]}
                onPress={() => setStatusFilter(filter)}
              >
                <ThemedText
                  style={[
                    styles.statusTabText,
                    isActive && styles.activeStatusText,
                    { color: isActive ? themeColors.text : themeColors.textSecondary },
                  ]}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </ThemedText>
              </TouchableOpacity>
            );
          })}

          {/* Sort trigger button */}
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: themeColors.backgroundElement }]}
            onPress={() => setIsSortModalVisible(true)}
          >
            <Ionicons name="funnel-outline" size={16} color={themeColors.text} />
            <ThemedText style={styles.sortButtonText}>Sort</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Category Chips Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              categoryId === null && { backgroundColor: themeColors.text },
            ]}
            onPress={() => setCategoryId(null)}
          >
            <ThemedText
              style={[
                styles.categoryChipText,
                categoryId === null && { color: themeColors.background, fontWeight: 'bold' },
                { color: categoryId === null ? themeColors.background : themeColors.text },
              ]}
            >
              All Categories
            </ThemedText>
          </TouchableOpacity>

          {categories.map((cat) => {
            const isSelected = categoryId === cat.id;
            const catColor = getCategoryColor(cat.name);
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  { borderLeftWidth: 3, borderLeftColor: catColor },
                  isSelected && { backgroundColor: catColor },
                ]}
                onPress={() => setCategoryId(isSelected ? null : cat.id)}
              >
                <ThemedText
                  style={[
                    styles.categoryChipText,
                    isSelected && { color: '#ffffff', fontWeight: 'bold' },
                    { color: isSelected ? '#ffffff' : themeColors.text },
                  ]}
                >
                  {cat.name}
                </ThemedText>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Task List */}
      {isLoading && tasks.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={themeColors.text} />
        </View>
      ) : isError && tasks.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="warning-outline" size={48} color="#ef4444" />
          <ThemedText style={styles.errorText}>Failed to load tasks</ThemedText>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: themeColors.text }]}
            onPress={() => refetch()}
          >
            <ThemedText style={{ color: themeColors.background }}>Retry</ThemedText>
          </TouchableOpacity>
        </View>
      ) : filteredSortedTasks.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
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
          <Ionicons name="document-text-outline" size={64} color={themeColors.textSecondary} />
          <ThemedText style={[styles.emptyText, { color: themeColors.textSecondary }]}>
            No tasks found.
          </ThemedText>
          <ThemedText style={[styles.emptySubtext, { color: themeColors.textSecondary }]}>
            Try adjusting filters or create a new task.
          </ThemedText>
        </ScrollView>
      ) : (
        <FlatList
          data={filteredSortedTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
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
        style={[styles.fab, { backgroundColor: themeColors.text }]}
        onPress={() => setIsCreateModalVisible(true)}
      >
        <Ionicons name="add" size={28} color={themeColors.background} />
      </TouchableOpacity>

      {/* Sort Options Modal */}
      <Modal
        visible={isSortModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSortModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsSortModalVisible(false)}
        >
          <View style={[styles.sortModalContent, { backgroundColor: themeColors.background }]}>
            <ThemedText style={styles.modalTitle}>Sort Tasks By</ThemedText>

            <View style={styles.modalDivider} />

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
                style={styles.sortOptionRow}
                onPress={() => setSortBy(option.value)}
              >
                <ThemedText
                  style={[
                    styles.sortOptionText,
                    sortBy === option.value && styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </ThemedText>
                {sortBy === option.value && (
                  <Ionicons name="checkmark" size={18} color="#10b981" />
                )}
              </TouchableOpacity>
            ))}

            <View style={styles.modalDivider} />

            <ThemedText style={styles.modalSubTitle}>Order</ThemedText>

            {/* Sort order options */}
            {(
              [
                { label: 'Ascending', value: 'asc' },
                { label: 'Descending', value: 'desc' },
              ] as const
            ).map((option) => (
              <TouchableOpacity
                key={option.value}
                style={styles.sortOptionRow}
                onPress={() => setSortOrder(option.value)}
              >
                <ThemedText
                  style={[
                    styles.sortOptionText,
                    sortOrder === option.value && styles.selectedOptionText,
                  ]}
                >
                  {option.label}
                </ThemedText>
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
          style={[styles.modalContainer, { backgroundColor: themeColors.background }]}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsCreateModalVisible(false)}>
              <ThemedText style={{ color: '#ef4444', fontSize: 16 }}>Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.modalTitleText}>New Task</ThemedText>
            <TouchableOpacity onPress={handleCreateTask}>
              <ThemedText style={{ color: '#10b981', fontSize: 16, fontWeight: 'bold' }}>
                Save
              </ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Title *</ThemedText>
              <TextInput
                placeholder="Enter task title"
                placeholderTextColor={themeColors.textSecondary}
                value={newTitle}
                onChangeText={setNewTitle}
                style={[
                  styles.formInput,
                  {
                    color: themeColors.text,
                    backgroundColor: themeColors.backgroundElement,
                  },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Description</ThemedText>
              <TextInput
                placeholder="Enter description"
                placeholderTextColor={themeColors.textSecondary}
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
                numberOfLines={3}
                style={[
                  styles.formInput,
                  styles.formInputMultiline,
                  {
                    color: themeColors.text,
                    backgroundColor: themeColors.backgroundElement,
                  },
                ]}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Category</ThemedText>
              <View style={styles.modalCategoryRow}>
                <TouchableOpacity
                  style={[
                    styles.formCategoryChip,
                    newCategoryId === null && { backgroundColor: themeColors.text },
                    { backgroundColor: themeColors.backgroundElement },
                  ]}
                  onPress={() => setNewCategoryId(null)}
                >
                  <ThemedText
                    style={[
                      styles.formCategoryChipText,
                      newCategoryId === null && { color: themeColors.background },
                      { color: themeColors.text },
                    ]}
                  >
                    None
                  </ThemedText>
                </TouchableOpacity>

                {categories.map((cat) => {
                  const isSel = newCategoryId === cat.id;
                  const catColor = getCategoryColor(cat.name);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.formCategoryChip,
                        { borderLeftColor: catColor, borderLeftWidth: 3 },
                        isSel && { backgroundColor: catColor },
                        !isSel && { backgroundColor: themeColors.backgroundElement },
                      ]}
                      onPress={() => setNewCategoryId(cat.id)}
                    >
                      <ThemedText
                        style={[
                          styles.formCategoryChipText,
                          isSel && { color: '#ffffff', fontWeight: 'bold' },
                          { color: isSel ? '#ffffff' : themeColors.text },
                        ]}
                      >
                        {cat.name}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={styles.formGroup}>
              <ThemedText style={styles.formLabel}>Due Date (YYYY-MM-DD)</ThemedText>
              <TextInput
                placeholder="YYYY-MM-DD"
                placeholderTextColor={themeColors.textSecondary}
                value={newDueDate}
                onChangeText={setNewDueDate}
                style={[
                  styles.formInput,
                  {
                    color: themeColors.text,
                    backgroundColor: themeColors.backgroundElement,
                  },
                ]}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  syncStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
  },
  syncStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncText: {
    fontSize: 12,
  },
  syncSpinner: {
    marginRight: 4,
  },
  filterSection: {
    paddingTop: Spacing.two,
    paddingBottom: Spacing.one,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.three,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.two,
    height: 40,
    marginBottom: Spacing.two,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  clearSearch: {
    padding: 4,
  },
  statusFilters: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.two,
    gap: Spacing.two,
  },
  statusTab: {
    flex: 1,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  statusTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeStatusText: {
    fontWeight: '700',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.two,
    height: 32,
    borderRadius: 8,
    gap: 4,
  },
  sortButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryScroll: {
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  categoryChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: Spacing.three,
    paddingBottom: Spacing.five * 3,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  errorText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ef4444',
  },
  primaryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.five,
    paddingBottom: Spacing.five * 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: Spacing.two,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  fab: {
    position: 'absolute',
    right: Spacing.four,
    bottom: Spacing.four,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sortModalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: Spacing.four,
    paddingBottom: Spacing.five,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: Spacing.two,
  },
  modalSubTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'gray',
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  modalDivider: {
    height: 1,
    backgroundColor: 'rgba(128,128,128,0.2)',
    marginVertical: Spacing.two,
  },
  sortOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  sortOptionText: {
    fontSize: 16,
    color: 'gray',
  },
  selectedOptionText: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  modalTitleText: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  modalScroll: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  formGroup: {
    gap: Spacing.one,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  formInput: {
    height: 44,
    borderRadius: 8,
    paddingHorizontal: Spacing.two,
    fontSize: 15,
  },
  formInputMultiline: {
    height: 100,
    paddingTop: Spacing.two,
    textAlignVertical: 'top',
  },
  modalCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingVertical: Spacing.one,
  },
  formCategoryChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: 8,
  },
  formCategoryChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
