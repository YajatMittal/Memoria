import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText, Button, Card, Notice, Screen } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

/** Each answer scores 1 (never) to 4 (very often). */
const QUESTIONS = [
  {
    question: 'How often do you forget recent conversations or events?',
    options: ['Rarely or never', 'Once or twice a month', 'Every week', 'Every day'],
  },
  {
    question: 'How often do you have trouble finding the right words?',
    options: ['Rarely or never', 'Sometimes', 'Often', 'Very often'],
  },
  {
    question: 'How often do you misplace important things, like keys or glasses?',
    options: ['Rarely or never', 'Once or twice a month', 'Every week', 'Every day'],
  },
  {
    question: 'How often do you forget appointments or plans?',
    options: ['Almost never', 'Occasionally', 'Frequently', 'Almost always'],
  },
  {
    question: 'How often do you feel confused or lost in familiar places?',
    options: ['Never', 'Rarely', 'Sometimes', 'Often'],
  },
];

const MIN = QUESTIONS.length; // all answers = 1
const MAX = QUESTIONS.length * 4;

function interpret(score: number) {
  const band = (score - MIN) / (MAX - MIN); // 0..1
  if (band <= 0.2) {
    return {
      tone: 'success' as const,
      title: 'Few memory concerns',
      text: 'Your answers suggest few everyday memory problems. Keep up healthy habits: sleep, exercise, social time and staying mentally active.',
    };
  }
  if (band <= 0.55) {
    return {
      tone: 'warning' as const,
      title: 'Some memory concerns',
      text: 'Your answers suggest some everyday memory difficulties. These can have many causes, such as stress, sleep or medication. If they continue or worsen, consider talking to a doctor.',
    };
  }
  return {
    tone: 'error' as const,
    title: 'Frequent memory concerns',
    text: 'Your answers suggest memory difficulties that happen often. We recommend talking to a doctor, who can look into the cause and suggest next steps.',
  };
}

export default function SelfCheckScreen() {
  const [answers, setAnswers] = useState<(number | null)[]>(() => QUESTIONS.map(() => null));
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);

  if (done) {
    const score = answers.reduce<number>((sum, a) => sum + (a ?? 0) + 1, 0);
    const result = interpret(score);
    return (
      <Screen withHeader>
        <Card>
          <AppText variant="heading">{result.title}</AppText>
          <Notice tone={result.tone}>{result.text}</Notice>
          <AppText variant="small">
            This short questionnaire is for reflection only. It is not a medical test and cannot diagnose Alzheimer's
            or any other condition.
          </AppText>
          <Button
            title="Start again"
            variant="secondary"
            icon="refresh"
            onPress={() => {
              setAnswers(QUESTIONS.map(() => null));
              setIndex(0);
              setDone(false);
            }}
          />
          <Button title="Done" onPress={() => router.back()} />
        </Card>
      </Screen>
    );
  }

  const q = QUESTIONS[index];
  const selected = answers[index];
  const isLast = index === QUESTIONS.length - 1;

  return (
    <Screen withHeader>
      <AppText variant="small">
        Question {index + 1} of {QUESTIONS.length}
      </AppText>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${((index + 1) / QUESTIONS.length) * 100}%` }]} />
      </View>
      <AppText variant="heading">{q.question}</AppText>

      <View style={styles.options} accessibilityRole="radiogroup">
        {q.options.map((label, i) => {
          const isSelected = selected === i;
          return (
            <Pressable
              key={label}
              onPress={() => setAnswers((prev) => prev.map((a, j) => (j === index ? i : a)))}
              style={[styles.option, isSelected && styles.optionSelected]}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
            >
              <View style={[styles.radio, isSelected && styles.radioSelected]}>
                {isSelected && <View style={styles.radioDot} />}
              </View>
              <AppText style={isSelected ? styles.optionTextSelected : undefined}>{label}</AppText>
            </Pressable>
          );
        })}
      </View>

      <Button
        title={isLast ? 'See my results' : 'Next'}
        icon={isLast ? 'checkmark' : 'arrow-forward'}
        disabled={selected === null}
        onPress={() => (isLast ? setDone(true) : setIndex(index + 1))}
      />
      {index > 0 && <Button title="Back" variant="ghost" onPress={() => setIndex(index - 1)} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: colors.surfaceMuted, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary },
  options: { gap: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 60,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceMuted },
  optionTextSelected: { fontWeight: '700', color: colors.primary },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
});
