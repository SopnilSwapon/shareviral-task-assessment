import React from 'react';
import { StyleSheet, TouchableOpacity, View, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedText } from './themed-text';
import { Colors, Spacing } from '../constants/theme';
import { TaskWithStarred, Category } from '../types';
import { getCategoryColor } from '../utils/colors';

interface TaskItemProps {
  task: TaskWithStarred;
  category?: Category;
  onToggleComplete: (id: string, completed: boolean) => void;
  onToggleStarred: (id: string) => void;
}

export const TaskItem = React.memo(function TaskItem({
  task,
  category,
  onToggleComplete,
  onToggleStarred,
}: TaskItemProps) {
  const scheme = useColorScheme();
  const themeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const handlePress = () => {
    router.push(`/task/${task.id}`);
  };

  const isCompleted = task.status === 'done';
  const categoryColor = getCategoryColor(category?.name);

  const formattedDueDate = task.due_date
    ? new Date(task.due_date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null;

  const isOverdue =
    task.due_date && !isCompleted && new Date(task.due_date).getTime() < Date.now();

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          backgroundColor: themeColors.backgroundElement,
          borderLeftColor: category ? categoryColor : themeColors.textSecondary,
        },
      ]}
      onPress={handlePress}
    >
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => onToggleComplete(task.id, !isCompleted)}
        testID={`task-checkbox-${task.id}`}
      >
        <Ionicons
          name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={isCompleted ? '#10b981' : themeColors.textSecondary}
        />
      </TouchableOpacity>

      <View style={styles.content}>
        <ThemedText
          style={[
            styles.title,
            isCompleted && styles.completedText,
            { color: isCompleted ? themeColors.textSecondary : themeColors.text },
          ]}
          numberOfLines={1}
        >
          {task.title}
        </ThemedText>

        <View style={styles.metaRow}>
          {category && (
            <View
              style={[
                styles.categoryBadge,
                { backgroundColor: categoryColor + '18' }, // 9% opacity
              ]}
            >
              <View
                style={[styles.categoryDot, { backgroundColor: categoryColor }]}
              />
              <ThemedText style={[styles.categoryText, { color: categoryColor }]}>
                {category.name}
              </ThemedText>
            </View>
          )}

          {formattedDueDate && (
            <View style={styles.dueDateBadge}>
              <Ionicons
                name="calendar-outline"
                size={12}
                color={isOverdue ? '#ef4444' : themeColors.textSecondary}
              />
              <ThemedText
                style={[
                  styles.dueDateText,
                  { color: isOverdue ? '#ef4444' : themeColors.textSecondary },
                ]}
              >
                {formattedDueDate}
              </ThemedText>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.starButton}
        onPress={() => onToggleStarred(task.id)}
        testID={`task-star-${task.id}`}
      >
        <Ionicons
          name={task.starred ? 'star' : 'star-outline'}
          size={22}
          color={task.starred ? '#f59e0b' : themeColors.textSecondary}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    marginBottom: Spacing.two,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  checkbox: {
    paddingRight: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingRight: Spacing.two,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    gap: 4,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dueDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  starButton: {
    paddingHorizontal: Spacing.one,
    paddingVertical: Spacing.one,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
