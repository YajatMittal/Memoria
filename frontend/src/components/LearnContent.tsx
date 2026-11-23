import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '@/theme';

import { AppText, Button, Card, IconName, Notice } from './ui';

const QUOTES = [
  'Every person with Alzheimer’s has a unique story to tell.',
  'The greatest gift you can give someone with Alzheimer’s is your time and understanding.',
  'Memory fades, but love remains.',
  'Early detection allows for better care and planning.',
];

const TOPICS: { icon: IconName; title: string; points: string[] }[] = [
  {
    icon: 'help-circle',
    title: "What is Alzheimer's disease?",
    points: [
      'A progressive brain disease that slowly affects memory, thinking and everyday abilities.',
      'It is the most common cause of dementia.',
      'It is not a normal part of aging, and symptoms get worse over time.',
    ],
  },
  {
    icon: 'alert-circle',
    title: 'Common warning signs',
    points: [
      'Memory loss that disrupts daily life',
      'Trouble planning or solving problems',
      'Confusion about time or place',
      'Difficulty finding the right words',
      'Changes in mood or personality',
    ],
  },
  {
    icon: 'heart',
    title: 'Keeping your brain healthy',
    points: [
      'Regular physical activity',
      'Staying socially connected and mentally active',
      'A balanced diet and good sleep',
      'Managing blood pressure, diabetes and stress',
    ],
  },
  {
    icon: 'people',
    title: 'Tips for caregivers',
    points: [
      'Keep a simple, predictable daily routine.',
      'Use photos and familiar objects to spark conversation.',
      'Speak calmly, use short sentences, and give time to respond.',
      'Look after yourself too — support groups can help.',
    ],
  },
];

const RESOURCES = [
  { label: "Alzheimer's Association", url: 'https://www.alz.org' },
  { label: 'Alzheimer Society of Canada', url: 'https://alzheimer.ca' },
  { label: 'National Institute on Aging', url: 'https://www.nia.nih.gov/health/alzheimers-and-dementia' },
];

/** Educational content shared by the public "About" page and the Learn tab. */
export function LearnContent() {
  const [quote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);
  const [openTopic, setOpenTopic] = useState<string | null>(TOPICS[0].title);

  return (
    <>
      <View style={styles.quote}>
        <AppText style={styles.quoteText}>“{quote}”</AppText>
      </View>

      <Notice tone="warning">
        If you or a loved one notice ongoing memory problems or changes in thinking, please talk to a doctor.
      </Notice>

      <Card style={styles.topicsCard}>
        {TOPICS.map((topic) => {
          const open = openTopic === topic.title;
          return (
            <View key={topic.title}>
              <Pressable
                onPress={() => setOpenTopic(open ? null : topic.title)}
                style={styles.topicHeader}
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
              >
                <Ionicons name={topic.icon} size={24} color={colors.primary} />
                <AppText style={styles.topicTitle}>{topic.title}</AppText>
                <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={22} color={colors.textMuted} />
              </Pressable>
              {open && (
                <View style={styles.points}>
                  {topic.points.map((p) => (
                    <AppText key={p}>• {p}</AppText>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </Card>

      <Card>
        <AppText variant="heading">Exercise your memory</AppText>
        <Button title="Take the memory self-check" icon="clipboard" onPress={() => router.push('/self-check')} />
        <Button
          title="Play the memory game"
          icon="game-controller"
          variant="secondary"
          onPress={() => router.push('/memory-game')}
        />
      </Card>

      <Card>
        <AppText variant="heading">Trusted resources</AppText>
        {RESOURCES.map((r) => (
          <Button
            key={r.url}
            title={r.label}
            icon="open-outline"
            variant="ghost"
            onPress={() => Linking.openURL(r.url)}
          />
        ))}
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  quote: { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: spacing.lg },
  quoteText: { fontStyle: 'italic', color: colors.primary, textAlign: 'center' },
  topicsCard: { gap: 0, paddingVertical: spacing.sm },
  topicHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: 56 },
  topicTitle: { flex: 1, fontWeight: '700' },
  points: { gap: spacing.xs, paddingLeft: 40, paddingBottom: spacing.md },
});
