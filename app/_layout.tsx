import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '@/state/AppContext';
import { checkForUpdate } from '@/services/updates';
import { UpdateProgress } from '@/components/UpdateProgress';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';

export default function RootLayout() {
  useEffect(() => {
    void checkForUpdate();
  }, []);
  return (
    <AppErrorBoundary><AppProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#000000' }, animation: 'fade' }} />
      <UpdateProgress />
    </AppProvider></AppErrorBoundary>
  );
}
