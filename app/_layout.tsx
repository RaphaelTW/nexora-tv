import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '@/state/AppContext';
import { checkForUpdate } from '@/services/updates';

export default function RootLayout() {
  useEffect(() => {
    void checkForUpdate();
  }, []);
  return (
    <AppProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' }, animation: 'fade' }} />
    </AppProvider>
  );
}
