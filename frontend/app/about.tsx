import { LearnContent } from '@/components/LearnContent';
import { Screen } from '@/components/ui';

/** Public version of the Learn tab, reachable from the welcome screen. */
export default function AboutScreen() {
  return (
    <Screen withHeader>
      <LearnContent />
    </Screen>
  );
}
