import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { AppText, Button, IconName, Screen } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

const FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'camera', title: 'Capture moments', text: 'Take a photo and Memoria describes it for you automatically.' },
  { icon: 'calendar', title: 'Look back on any day', text: 'Browse your photos on a simple calendar.' },
  { icon: 'chatbubble-ellipses', title: 'Just ask', text: '“What did I do yesterday?” — get a gentle summary of your day.' },
  { icon: 'location', title: 'New-place reminders', text: 'A nudge to take a photo when you visit somewhere new.' },
];

export default function WelcomeScreen() {
  return (
    <Screen contentStyle={styles.content}>
      <Image
        source={require('../../assets/images/logo.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityLabel="Memoria"
      />
      <AppText variant="heading" style={styles.tagline}>
        Hold on to the moments that matter.
      </AppText>
      <AppText variant="muted" style={styles.center}>
        A memory companion for people living with Alzheimer's and memory loss, and the people who care for them.
      </AppText>

      <View style={styles.features}>
        {FEATURES.map((f) => (
          <View key={f.title} style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name={f.icon} size={24} color={colors.primary} />
            </View>
            <View style={styles.featureText}>
              <AppText style={styles.bold}>{f.title}</AppText>
              <AppText variant="small">{f.text}</AppText>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <Button title="Create an account" icon="person-add" onPress={() => router.push('/signup')} />
        <Button title="I already have an account" variant="secondary" onPress={() => router.push('/login')} />
        <Button title="Learn about Alzheimer's" variant="ghost" icon="book" onPress={() => router.push('/about')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.xl },
  logo: { width: '100%', height: 120 },
  tagline: { textAlign: 'center' },
  center: { textAlign: 'center' },
  features: { gap: spacing.md, marginVertical: spacing.sm },
  feature: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1 },
  bold: { fontWeight: '700' },
  actions: { gap: spacing.md },
});
