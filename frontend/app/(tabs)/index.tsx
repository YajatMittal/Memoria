import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { api, errorMessage, Memory } from '@/api';
import { MemoryCard } from '@/components/MemoryCard';
import { AppText, Button, Card, EmptyState, Notice, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { spacing } from '@/theme';
import { confirm } from '@/utils/confirm';
import { greeting, localDay, longDay } from '@/utils/date';

export default function TodayScreen() {
  const { user, logout } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const today = localDay();

  const load = useCallback(() => {
    api.memories.forDay(localDay()).then(setMemories).catch(() => {});
  }, []);
  useFocusEffect(load);

  const capture = async (source: 'camera' | 'library') => {
    setMessage(null);
    const permission =
      source === 'camera'
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setMessage({
        tone: 'error',
        text: `Memoria needs permission to use your ${source === 'camera' ? 'camera' : 'photos'}. You can allow it in Settings.`,
      });
      return;
    }

    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };
    const result =
      source === 'camera' && Platform.OS !== 'web'
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);
    if (result.canceled) return;

    setUploading(true);
    try {
      const memory = await api.memories.upload(result.assets[0].uri, today);
      setMemories((prev) => [...prev, memory]);
      setMessage({ tone: 'success', text: `Saved! “${memory.caption}”` });
    } catch (err) {
      setMessage({ tone: 'error', text: errorMessage(err) });
    } finally {
      setUploading(false);
    }
  };

  const onLogout = async () => {
    if (await confirm('Log out?', 'You can log back in any time with your email and password.', 'Log out')) {
      await logout();
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <AppText variant="muted">{greeting()},</AppText>
          <AppText variant="title">{user?.username}</AppText>
          <AppText variant="muted">Today is {longDay(today)}.</AppText>
        </View>
        <Button title="Log out" variant="ghost" compact onPress={onLogout} />
      </View>

      <Card>
        <AppText variant="heading">Capture a moment</AppText>
        <AppText variant="muted">
          Take a photo of what you're doing, who you're with, or where you are. Memoria will describe it and save it to
          today.
        </AppText>
        {message && <Notice tone={message.tone}>{message.text}</Notice>}
        {uploading ? (
          <Notice tone="info">Saving your photo and describing it… this can take a few seconds.</Notice>
        ) : (
          <View style={styles.actions}>
            {Platform.OS !== 'web' && <Button title="Take a photo" icon="camera" onPress={() => capture('camera')} />}
            <Button
              title="Choose a photo"
              icon="images"
              variant={Platform.OS === 'web' ? 'primary' : 'secondary'}
              onPress={() => capture('library')}
            />
          </View>
        )}
      </Card>

      <AppText variant="heading">Today's memories</AppText>
      {memories.length === 0 ? (
        <EmptyState
          icon="sunny-outline"
          title="No photos yet today"
          message="Photos you take today will show up here."
        />
      ) : (
        memories.map((m) => <MemoryCard key={m.id} memory={m} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  headerText: { flex: 1, gap: spacing.xs },
  actions: { gap: spacing.md },
});
