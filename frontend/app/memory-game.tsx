import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';

import { AppText, Button, Notice, Screen } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

const SYMBOLS = ['🌻', '🐶', '🍎', '⭐', '🎈', '🐟', '🌙', '🎵'];
const COLUMNS = 4;
const GAP = spacing.sm;
const PREVIEW_MS = 2500;
const MISMATCH_MS = 1000;

type Card = { id: number; symbol: string; matched: boolean };

function shuffledDeck(): Card[] {
  const deck = [...SYMBOLS, ...SYMBOLS].map((symbol, id) => ({ id, symbol, matched: false }));
  // Fisher–Yates shuffle (unbiased, unlike sort(() => Math.random() - 0.5)).
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export default function MemoryGameScreen() {
  const { width } = useWindowDimensions();
  const [cards, setCards] = useState<Card[]>(shuffledDeck);
  const [faceUp, setFaceUp] = useState<number[]>([]);
  const [previewing, setPreviewing] = useState(true);
  const [moves, setMoves] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const contentWidth = Math.min(width, 720) - spacing.lg * 2;
  const cardSize = Math.min(96, (contentWidth - GAP * (COLUMNS - 1)) / COLUMNS);

  const matchedPairs = cards.filter((c) => c.matched).length / 2;
  const won = matchedPairs === SYMBOLS.length;

  const restart = useCallback(() => {
    clearTimeout(timer.current);
    setCards(shuffledDeck());
    setFaceUp([]);
    setMoves(0);
    setPreviewing(true);
    // Show every card briefly so the player can try to memorise them.
    timer.current = setTimeout(() => setPreviewing(false), PREVIEW_MS);
  }, []);

  useEffect(() => {
    restart();
    return () => clearTimeout(timer.current);
  }, [restart]);

  const flip = (index: number) => {
    const card = cards[index];
    if (previewing || card.matched || faceUp.includes(index) || faceUp.length === 2) return;

    const next = [...faceUp, index];
    setFaceUp(next);
    if (next.length < 2) return;

    setMoves((m) => m + 1);
    const [a, b] = next;
    if (cards[a].symbol === cards[b].symbol) {
      setCards((prev) => prev.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)));
      setFaceUp([]);
    } else {
      timer.current = setTimeout(() => setFaceUp([]), MISMATCH_MS);
    }
  };

  return (
    <Screen withHeader>
      <AppText variant="muted">
        Find the matching pairs. All the cards are shown for a moment at the start — try to remember where they are!
      </AppText>
      <View style={styles.stats}>
        <AppText style={styles.stat}>Moves: {moves}</AppText>
        <AppText style={styles.stat}>
          Pairs: {matchedPairs} / {SYMBOLS.length}
        </AppText>
      </View>

      {won && <Notice tone="success">Wonderful — you found every pair in {moves} moves!</Notice>}

      <View style={[styles.grid, { width: cardSize * COLUMNS + GAP * (COLUMNS - 1) }]}>
        {cards.map((card, i) => {
          const visible = previewing || card.matched || faceUp.includes(i);
          return (
            <Pressable
              key={card.id}
              onPress={() => flip(i)}
              accessibilityRole="button"
              accessibilityLabel={visible ? card.symbol : 'Hidden card'}
              style={[
                styles.card,
                { width: cardSize, height: cardSize },
                visible ? styles.cardFront : styles.cardBack,
                card.matched && styles.cardMatched,
              ]}
            >
              <Text style={{ fontSize: cardSize * 0.45 }}>{visible ? card.symbol : ''}</Text>
            </Pressable>
          );
        })}
      </View>

      <Button title="New game" icon="refresh" variant="secondary" onPress={restart} />
      {won && <ConfettiCannon count={120} origin={{ x: width / 2, y: -20 }} fadeOut />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: { fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP, alignSelf: 'center' },
  card: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  cardBack: { backgroundColor: colors.primary, borderColor: colors.primary },
  cardFront: { backgroundColor: colors.surface, borderColor: colors.border },
  cardMatched: { backgroundColor: colors.successSoft, borderColor: colors.success },
});
