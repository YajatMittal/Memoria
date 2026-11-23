import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { api } from '@/api';

const DAILY_REMINDER_ID = 'memoria-daily-reminder';
const REMINDER_HOUR = 19; // 7 PM local time

async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/** A gentle once-a-day nudge to capture a photo of the day. */
export function useDailyReminder(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    (async () => {
      if (!(await ensureNotificationPermission())) return;
      // Re-using the identifier replaces any previously scheduled copy.
      await Notifications.scheduleNotificationAsync({
        identifier: DAILY_REMINDER_ID,
        content: {
          title: 'How was your day? 📸',
          body: 'Take a photo of something from today so you can look back on it later.',
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: REMINDER_HOUR, minute: 0 },
      });
    })().catch((err) => console.warn('Could not schedule daily reminder', err));
  }, [enabled]);
}

const MIN_CHECK_INTERVAL_MS = 60_000;

/**
 * Watches the user's location while the app is open. When they arrive somewhere
 * they haven't been before, it suggests taking a photo to remember the visit.
 */
export function useNewPlaceNudges(enabled: boolean) {
  useEffect(() => {
    if (!enabled || Platform.OS === 'web') return;

    let subscription: Location.LocationSubscription | null = null;
    let cancelled = false;
    let lastCheck = 0;

    (async () => {
      const { granted } = await Location.requestForegroundPermissionsAsync();
      if (!granted || cancelled) return;

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: MIN_CHECK_INTERVAL_MS, distanceInterval: 100 },
        async ({ coords }) => {
          const now = Date.now();
          if (now - lastCheck < MIN_CHECK_INTERVAL_MS) return;
          lastCheck = now;
          try {
            const { place, is_new } = await api.places.visit(coords.latitude, coords.longitude);
            if (place && is_new && (await ensureNotificationPermission())) {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: `You're somewhere new 📍`,
                  body: `Welcome to ${place.name}! Take a photo so you can remember this visit.`,
                },
                trigger: null,
              });
            }
          } catch (err) {
            console.warn('Place check failed', err);
          }
        },
      );
      if (cancelled) subscription.remove();
    })().catch((err) => console.warn('Location tracking unavailable', err));

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [enabled]);
}
