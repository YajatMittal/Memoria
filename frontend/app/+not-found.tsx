import { router, Stack } from 'expo-router';

import { Button, EmptyState, Screen } from '@/components/ui';

export default function NotFoundScreen() {
  return (
    <Screen withHeader>
      <Stack.Screen options={{ title: 'Not found' }} />
      <EmptyState icon="compass-outline" title="This page doesn't exist" message="Let's get you back home." />
      <Button title="Go home" icon="home" onPress={() => router.replace('/')} />
    </Screen>
  );
}
