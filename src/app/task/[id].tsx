import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  useColorScheme,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { tasksApi } from '../../api/tasksApi';
import { useAppStore } from '../../store/useAppStore';
import { ThemedText } from '../../components/themed-text';
import { Colors, Spacing } from '../../constants/theme';
import { Task, Category, UpdateTaskInput } from '../../types';
import { OfflineBanner } from '../../components/OfflineBanner';
import { getCategoryColor } from '../../utils/colors';

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const scheme = useColorScheme();
  const themeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];
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
      <View style={[styles.center, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.text} />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={[styles.center, { backgroundColor: themeColors.background }]}>
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <ThemedText style={styles.errorText}>Task not found</ThemedText>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedText style={{ color: themeColors.background }}>Go Back</ThemedText>
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <OfflineBanner />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Category Label */}
        {category && (
          <View style={[styles.categoryHeader, { backgroundColor: categoryColor + '15' }]}>
            <View style={[styles.categoryDot, { backgroundColor: categoryColor }]} />
            <ThemedText style={[styles.categoryText, { color: categoryColor }]}>
              {category.name}
            </ThemedText>
          </View>
        )}

        {/* Title & Star Row */}
        <View style={styles.titleRow}>
          <ThemedText style={[styles.title, isCompleted && styles.completedText]}>
            {task.title}
          </ThemedText>
          <TouchableOpacity
            style={styles.starButton}
            onPress={() => toggleStarredTask(task.id)}
            testID="detail-star-button"
          >
            <Ionicons
              name={isStarred ? 'star' : 'star-outline'}
              size={28}
              color={isStarred ? '#f59e0b' : themeColors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* Date Row */}
        <View style={[styles.metaRow, { borderBottomColor: themeColors.backgroundElement }]}>
          <Ionicons name="calendar-outline" size={20} color={themeColors.textSecondary} />
          <View>
            <ThemedText style={[styles.metaLabel, { color: themeColors.textSecondary }]}>
              Due Date
            </ThemedText>
            <ThemedText style={styles.metaValue}>{formattedDueDate}</ThemedText>
          </View>
        </View>

        {/* Status Row */}
        <View style={[styles.metaRow, { borderBottomColor: themeColors.backgroundElement }]}>
          <Ionicons
            name={isCompleted ? 'checkmark-circle-outline' : 'ellipse-outline'}
            size={20}
            color={isCompleted ? '#10b981' : themeColors.textSecondary}
          />
          <View>
            <ThemedText style={[styles.metaLabel, { color: themeColors.textSecondary }]}>
              Status
            </ThemedText>
            <ThemedText style={styles.metaValue}>
              {isCompleted ? 'Completed' : 'In Progress'}
            </ThemedText>
          </View>
        </View>

        {/* Description Section */}
        <View style={styles.descriptionSection}>
          <ThemedText style={[styles.descriptionTitle, { color: themeColors.textSecondary }]}>
            Description
          </ThemedText>
          <ThemedText style={styles.descriptionText}>
            {task.description || 'No description provided.'}
          </ThemedText>
        </View>

        {/* Actions Button Group */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: isCompleted ? themeColors.backgroundElement : '#10b981' },
            ]}
            onPress={handleToggleComplete}
            disabled={updateTaskMutation.isPending}
            testID="detail-complete-button"
          >
            {updateTaskMutation.isPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons
                  name={isCompleted ? 'close-circle-outline' : 'checkmark-circle-outline'}
                  size={20}
                  color={isCompleted ? themeColors.text : '#ffffff'}
                />
                <ThemedText
                  style={[
                    styles.actionButtonText,
                    { color: isCompleted ? themeColors.text : '#ffffff' },
                  ]}
                >
                  {isCompleted ? 'Mark Open' : 'Mark Completed'}
                </ThemedText>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: themeColors.backgroundElement }]}
            onPress={handleOpenEdit}
          >
            <Ionicons name="create-outline" size={20} color={themeColors.text} />
            <ThemedText style={[styles.actionButtonText, { color: themeColors.text }]}>
              Edit Task
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={handleDeleteConfirm}
            disabled={deleteTaskMutation.isPending}
          >
            {deleteTaskMutation.isPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="trash-outline" size={20} color="#ffffff" />
                <ThemedText style={[styles.actionButtonText, { color: '#ffffff' }]}>
                  Delete Task
                </ThemedText>
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
          style={[styles.modalContainer, { backgroundColor: themeColors.background }]}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
              <ThemedText style={{ color: '#ef4444', fontSize: 16 }}>Cancel</ThemedText>
            </TouchableOpacity>
            <ThemedText style={styles.modalTitleText}>Edit Task</ThemedText>
            <TouchableOpacity onPress={handleSaveEdit}>
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
                value={editTitle}
                onChangeText={setEditTitle}
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
                value={editDescription}
                onChangeText={setEditDescription}
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
                    editCategoryId === null && { backgroundColor: themeColors.text },
                    { backgroundColor: themeColors.backgroundElement },
                  ]}
                  onPress={() => setEditCategoryId(null)}
                >
                  <ThemedText
                    style={[
                      styles.formCategoryChipText,
                      editCategoryId === null && { color: themeColors.background },
                      { color: themeColors.text },
                    ]}
                  >
                    None
                  </ThemedText>
                </TouchableOpacity>

                {categories.map((cat) => {
                  const isSel = editCategoryId === cat.id;
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
                      onPress={() => setEditCategoryId(cat.id)}
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
                value={editDueDate}
                onChangeText={setEditDueDate}
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
  scrollContainer: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.two,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
  },
  backButton: {
    backgroundColor: 'gray',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: Spacing.two,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: Spacing.two,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  starButton: {
    padding: Spacing.one,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
  },
  metaLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 15,
    fontWeight: '500',
  },
  descriptionSection: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  descriptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  actionsContainer: {
    marginTop: Spacing.five,
    gap: Spacing.three,
  },
  actionButton: {
    flexDirection: 'row',
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: '#ef4444',
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
