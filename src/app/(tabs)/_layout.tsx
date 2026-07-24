import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#f3f4f6',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          shadowOpacity: 0,
          elevation: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#f3f4f6',
        },
        headerTitleStyle: {
          color: '#000000',
          fontWeight: 'bold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tasks',
          tabBarLabel: 'Tasks',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'checkbox' : 'checkbox-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Categories',
          tabBarLabel: 'Categories',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? 'folder-open' : 'folder-open-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
