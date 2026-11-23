import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/context/AuthContext';
import { colors, fontSize } from '@/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { restoring } = useAuth();

  useEffect(() => {
    if (!restoring) SplashScreen.hideAsync().catch(() => {});
  }, [restoring]);

  // Keep the splash screen up until we know whether the user is logged in,
  // so the auth/tab redirects never flash the wrong screen.
  if (restoring) return null;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontSize: fontSize.large, fontWeight: '700' },
        headerShadowVisible: false,
        headerBackTitle: 'Back',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="community/[postId]" options={{ title: 'Discussion' }} />
      <Stack.Screen name="self-check" options={{ title: 'Memory self-check' }} />
      <Stack.Screen name="memory-game" options={{ title: 'Memory game' }} />
      <Stack.Screen name="about" options={{ title: "About Alzheimer's" }} />
    </Stack>
  );
}
