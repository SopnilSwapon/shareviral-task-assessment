import React, { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { Stack, ThemeProvider, DarkTheme, DefaultTheme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import NetInfo from '@react-native-community/netinfo';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';

import { queryClient, asyncStoragePersister } from '../api/queryClient';
import { useAppStore } from '../store/useAppStore';
import { AnimatedSplashOverlay } from '../components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
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
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: colorScheme === 'dark' ? '#000000' : '#ffffff',
            },
            headerTitleStyle: {
              fontWeight: 'bold',
            },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="task/[id]" options={{ title: 'Task Details', headerBackTitle: 'Back' }} />
        </Stack>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
