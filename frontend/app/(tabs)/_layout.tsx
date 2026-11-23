import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { IconName } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { useDailyReminder, useNewPlaceNudges } from '@/hooks/useReminders';
import { colors } from '@/theme';

const TABS: { name: string; title: string; icon: IconName; iconActive: IconName }[] = [
  { name: 'index', title: 'Today', icon: 'home-outline', iconActive: 'home' },
  { name: 'memories', title: 'Memories', icon: 'calendar-outline', iconActive: 'calendar' },
  { name: 'assistant', title: 'Ask', icon: 'chatbubble-ellipses-outline', iconActive: 'chatbubble-ellipses' },
  { name: 'community', title: 'Forum', icon: 'people-outline', iconActive: 'people' },
  { name: 'learn', title: 'Learn', icon: 'book-outline', iconActive: 'book' },
];

/** The signed-in part of the app. */
export default function TabsLayout() {
  const { user } = useAuth();
  useDailyReminder(!!user);
  useNewPlaceNudges(!!user);

  if (!user) return <Redirect href="/welcome" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, minHeight: 64 },
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600' },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused, size }) => (
              <Ionicons name={focused ? tab.iconActive : tab.icon} color={color} size={size + 2} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
