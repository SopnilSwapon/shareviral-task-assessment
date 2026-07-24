import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Category, TaskWithStarred } from '../types';
import { getCategoryColor } from '../utils/colors';

interface ITaskItemProps {
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
}: ITaskItemProps) {
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
      style={{ borderLeftColor: category ? categoryColor : '#9ca3af' }}
      className="flex-row items-center p-3 rounded-lg mb-4 border-l-4 border border-gray-100 bg-slate-50"
      onPress={handlePress}
    >
      <TouchableOpacity
        className="pr-2 justify-center items-center"
        onPress={() => onToggleComplete(task.id, !isCompleted)}
        testID={`task-checkbox-${task.id}`}
      >
        <Ionicons
          name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={isCompleted ? '#10b981' : '#9ca3af'}
        />
      </TouchableOpacity>

      <View className="flex-1 pr-2">
        <Text
          className={`text-base font-semibold mb-1 text-black ${
            isCompleted ? 'line-through text-gray-400' : ''
          }`}
          numberOfLines={1}
        >
          {task.title}
        </Text>

        <View className="flex-row items-center gap-2">
          {category && (
            <View
              style={{ backgroundColor: categoryColor + '18' }}
              className="flex-row items-center py-0.5 px-1.5 rounded gap-1"
            >
              <View
                style={{ backgroundColor: categoryColor }}
                className="w-1.5 h-1.5 rounded-full"
              />
              <Text style={{ color: categoryColor }} className="text-[11px] font-bold">
                {category.name}
              </Text>
            </View>
          )}

          {formattedDueDate && (
            <View className="flex-row items-center gap-1">
              <Ionicons
                name="calendar-outline"
                size={12}
                color={isOverdue ? '#ef4444' : '#6b7280'}
              />
              <Text
                className={`text-[11px] font-medium ${
                  isOverdue ? 'text-red-500' : 'text-gray-500'
                }`}
              >
                {formattedDueDate}
              </Text>
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        className="px-1 py-1 justify-center items-center"
        onPress={() => onToggleStarred(task.id)}
        testID={`task-star-${task.id}`}
      >
        <Ionicons
          name={task.starred ? 'star' : 'star-outline'}
          size={22}
          color={task.starred ? '#f59e0b' : '#9ca3af'}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
});
