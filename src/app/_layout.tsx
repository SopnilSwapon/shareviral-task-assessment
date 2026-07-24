import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar, LogBox } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

LogBox.ignoreLogs(['Cannot connect to Expo CLI']);

import '../global.css';
import { queryClient, asyncStoragePersister } from '../api/queryClient';
import { useAppStore } from '../store/useAppStore';
import { AnimatedSplashOverlay } from '../components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const setIsOnline = useAppStore((state) => state.setIsOnline);

  // Network Status Monitor
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // Treat null/undefined as true during check, but false if explicitly disconnected
      setIsOnline(state.isConnected !== false);
    });
    return () => unsubscribe();
  }, [setIsOnline]);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: asyncStoragePersister,
        maxAge: 1000 * 60 * 60 * 24, // 24 hours cache retention
      }}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} />
      <AnimatedSplashOverlay />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#000000',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: '#ffffff',
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="task/[id]"
          options={{
            title: 'Task Details',
            headerBackTitle: 'Back',
            animation: 'slide_from_right',
            gestureEnabled: true,
          }}
        />
      </Stack>
    </PersistQueryClientProvider>
  );
}
