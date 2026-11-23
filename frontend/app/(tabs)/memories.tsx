import * as FileSystem from 'expo-file-system';
import { useFocusEffect } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Image, Modal, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, errorMessage, Memory, memoryUri } from '@/api';
import { MemoryCard } from '@/components/MemoryCard';
import { AppText, Button, Card, EmptyState, Notice, Screen } from '@/components/ui';
import { colors, fontSize, radius, spacing } from '@/theme';
import { confirm } from '@/utils/confirm';
import { clockTime, localDay, longDay } from '@/utils/date';

export default function MemoriesScreen() {
  const [selectedDay, setSelectedDay] = useState(localDay());
  const [daysWithPhotos, setDaysWithPhotos] = useState<Record<string, number>>({});
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<Memory | null>(null);

  const loadDays = useCallback(() => {
    api.memories.days().then(setDaysWithPhotos).catch(() => {});
  }, []);
  useFocusEffect(loadDays);

  const loadDay = useCallback(async (day: string) => {
    setLoading(true);
    setError(null);
    try {
      setMemories(await api.memories.forDay(day));
    } catch (err) {
      setError(errorMessage(err));
      setMemories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDay(selectedDay);
  }, [selectedDay, loadDay]);

  const marked = useMemo(() => {
    const marks: Record<string, object> = {};
    for (const day of Object.keys(daysWithPhotos)) marks[day] = { marked: true, dotColor: colors.primary };
    marks[selectedDay] = {
      ...marks[selectedDay],
      selected: true,
      selectedColor: colors.primary,
      selectedDotColor: colors.onPrimary, // keep the dot visible on the selected (purple) day
    };
    return marks;
  }, [daysWithPhotos, selectedDay]);

  const onDeleted = (id: number) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    setOpen(null);
    loadDays();
  };

  return (
    <Screen>
      <AppText variant="title">Your memories</AppText>
      <AppText variant="muted">Tap a day to see the photos you took. Days with photos have a dot.</AppText>

      <Card style={styles.calendarCard}>
        <Calendar
          current={selectedDay}
          maxDate={localDay()}
          onDayPress={(d: DateData) => setSelectedDay(d.dateString)}
          markedDates={marked}
          enableSwipeMonths
          theme={{
            todayTextColor: colors.primary,
            arrowColor: colors.primary,
            textDayFontSize: fontSize.body,
            textMonthFontSize: fontSize.large,
            textMonthFontWeight: '700',
            textDayHeaderFontSize: fontSize.small,
            dayTextColor: colors.text,
            textDisabledColor: colors.border,
            calendarBackground: colors.surface,
          }}
        />
      </Card>

      <AppText variant="heading">{selectedDay === localDay() ? 'Today' : longDay(selectedDay)}</AppText>
      {error && <Notice>{error}</Notice>}
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : memories.length === 0 ? (
        <EmptyState icon="images-outline" title="No photos on this day" />
      ) : (
        memories.map((m) => <MemoryCard key={m.id} memory={m} onPress={() => setOpen(m)} />)
      )}

      <MemoryViewer memory={open} onClose={() => setOpen(null)} onDeleted={onDeleted} />
    </Screen>
  );
}

function MemoryViewer({
  memory,
  onClose,
  onDeleted,
}: {
  memory: Memory | null;
  onClose: () => void;
  onDeleted: (id: number) => void;
}) {
  const [busy, setBusy] = useState<'share' | 'delete' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setError(null);
    if (Platform.OS !== 'web') Sharing.isAvailableAsync().then(setCanShare);
  }, [memory]);

  if (!memory) return null;

  const share = async () => {
    setBusy('share');
    try {
      const file = `${FileSystem.cacheDirectory}memoria-${memory.id}.jpg`;
      await FileSystem.writeAsStringAsync(file, memory.image, { encoding: FileSystem.EncodingType.Base64 });
      await Sharing.shareAsync(file, { mimeType: memory.mime_type, dialogTitle: memory.caption });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!(await confirm('Delete this photo?', 'This cannot be undone.', 'Delete'))) return;
    setBusy('delete');
    try {
      await api.memories.remove(memory.id);
      onDeleted(memory.id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.viewer}>
        <ScrollView contentContainerStyle={styles.viewerContent}>
          <Image source={{ uri: memoryUri(memory) }} style={styles.viewerImage} resizeMode="contain" />
          <AppText variant="heading">{memory.caption}</AppText>
          <AppText variant="muted">
            {longDay(memory.captured_on)} at {clockTime(memory.captured_at)}
          </AppText>
          {error && <Notice>{error}</Notice>}
          <View style={styles.viewerActions}>
            {canShare && (
              <Button title="Share" icon="share-social" variant="secondary" onPress={share} loading={busy === 'share'} />
            )}
            <Button title="Delete photo" icon="trash" variant="danger" onPress={remove} loading={busy === 'delete'} />
            <Button title="Close" onPress={onClose} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  calendarCard: { padding: spacing.sm, overflow: 'hidden' },
  viewer: { flex: 1, backgroundColor: colors.background },
  viewerContent: { padding: spacing.lg, gap: spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' },
  viewerImage: { width: '100%', aspectRatio: 1, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted },
  viewerActions: { gap: spacing.md, marginTop: spacing.sm },
});
