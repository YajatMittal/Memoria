import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme';

/** Public screens. Logged-in users are sent straight to the app. */
export default function AuthLayout() {
  const { user } = useAuth();
  if (user) return <Redirect href="/" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
