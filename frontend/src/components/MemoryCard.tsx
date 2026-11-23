import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Memory, memoryUri } from '@/api';
import { colors, radius, shadow, spacing } from '@/theme';
import { clockTime } from '@/utils/date';

import { AppText } from './ui';

export function MemoryCard({ memory, onPress }: { memory: Memory; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'image'}
      accessibilityLabel={`Photo at ${clockTime(memory.captured_at)}: ${memory.caption}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Image source={{ uri: memoryUri(memory) }} style={styles.image} resizeMode="cover" />
      <View style={styles.body}>
        <AppText variant="small">{clockTime(memory.captured_at)}</AppText>
        <AppText>{memory.caption}</AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', ...shadow },
  pressed: { opacity: 0.85 },
  image: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.surfaceMuted },
  body: { padding: spacing.md, gap: spacing.xs },
});
