import { LearnContent } from '@/components/LearnContent';
import { AppText, Screen } from '@/components/ui';

export default function LearnScreen() {
  return (
    <Screen>
      <AppText variant="title">Learn</AppText>
      <AppText variant="muted">Understanding Alzheimer's, and ways to keep your mind active.</AppText>
      <LearnContent />
    </Screen>
  );
}
