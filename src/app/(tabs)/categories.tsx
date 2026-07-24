import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  useColorScheme,
  SafeAreaView,
  Keyboard,
  Platform,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

import { tasksApi } from '../../api/tasksApi';
import { ThemedText } from '../../components/themed-text';
import { Colors, Spacing } from '../../constants/theme';
import { Category, CreateCategoryInput } from '../../types';
import { OfflineBanner } from '../../components/OfflineBanner';
import { getCategoryColor } from '../../utils/colors';

export default function CategoriesScreen() {
  const scheme = useColorScheme();
  const themeColors = Colors[scheme === 'dark' ? 'dark' : 'light'];
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <OfflineBanner />

      <View style={styles.container}>
        {/* Form Container */}
        <View style={[styles.formContainer, { backgroundColor: themeColors.backgroundElement }]}>
          <ThemedText style={styles.formTitle}>Add New Category</ThemedText>

          <View style={styles.inputRow}>
            <TextInput
              placeholder="Category name..."
              placeholderTextColor={themeColors.textSecondary}
              value={name}
              onChangeText={setName}
              style={[
                styles.input,
                { color: themeColors.text, backgroundColor: themeColors.background },
              ]}
              testID="category-name-input"
            />
            <TouchableOpacity
              style={[
                styles.addButton,
                { backgroundColor: themeColors.text },
                createCategoryMutation.isPending && { opacity: 0.7 },
              ]}
              onPress={handleCreate}
              disabled={createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending ? (
                <ActivityIndicator size="small" color={themeColors.background} />
              ) : (
                <Ionicons name="add" size={24} color={themeColors.background} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories List */}
        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <ThemedText style={styles.listTitle}>All Categories</ThemedText>
            {isFetching && !isLoading && (
              <ActivityIndicator size="small" color={themeColors.text} />
            )}
          </View>

          {isLoading ? (
            <ActivityIndicator size="large" color={themeColors.text} style={styles.loader} />
          ) : categories.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="folder-outline" size={48} color={themeColors.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: themeColors.textSecondary }]}>
                No categories created yet.
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={categories}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              renderItem={({ item }) => {
                const catColor = getCategoryColor(item.name);
                return (
                  <View
                    style={[
                      styles.categoryItem,
                      { backgroundColor: themeColors.backgroundElement },
                    ]}
                  >
                    <View style={styles.categoryLeft}>
                      <View style={[styles.categoryDot, { backgroundColor: catColor }]} />
                      <ThemedText style={styles.categoryName}>{item.name}</ThemedText>
                    </View>
                    <ThemedText style={[styles.categoryColorCode, { color: themeColors.textSecondary }]}>
                      {catColor}
                    </ThemedText>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  formContainer: {
    padding: Spacing.three,
    borderRadius: Spacing.two,
    gap: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    paddingHorizontal: Spacing.two,
    fontSize: 15,
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.1)',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listSection: {
    flex: 1,
    gap: Spacing.two,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loader: {
    marginTop: 40,
  },
  listContainer: {
    paddingBottom: Spacing.four,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    marginBottom: Spacing.two,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
  },
  categoryColorCode: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Courier', android: 'monospace', default: 'monospace' }),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  emptyText: {
    fontSize: 14,
    marginTop: Spacing.two,
  },
});
