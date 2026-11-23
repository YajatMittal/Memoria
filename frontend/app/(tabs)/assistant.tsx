import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api, ChatTurn, errorMessage, Memory, memoryUri } from '@/api';
import { AppText } from '@/components/ui';
import { colors, fontSize, radius, spacing, touchTarget } from '@/theme';
import { localDay } from '@/utils/date';

type Message = { id: string; role: 'user' | 'assistant'; text: string; memories?: Memory[]; isError?: boolean };

const SUGGESTIONS = ['What did I do today?', 'What did I do yesterday?', 'Tell me something cheerful'];

const WELCOME: Message = {
  id: 'welcome',
  role: 'assistant',
  text: "Hi! I'm here to help you remember. Ask me about any day — for example, “What did I do yesterday?”",
};

let nextId = 0;
const newId = () => String(++nextId);

export default function AssistantScreen() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || thinking) return;
    setInput('');

    const history: ChatTurn[] = messages
      .filter((m) => m.id !== 'welcome' && !m.isError)
      .slice(-10)
      .map(({ role, text }) => ({ role, text }));
    setMessages((prev) => [...prev, { id: newId(), role: 'user', text: message }]);
    setThinking(true);

    try {
      const reply = await api.assistant.chat(message, localDay(), history);
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: 'assistant', text: reply.reply, memories: reply.memories },
      ]);
    } catch (err) {
      setMessages((prev) => [...prev, { id: newId(), role: 'assistant', text: errorMessage(err), isError: true }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <View style={styles.header}>
          <AppText variant="title">Ask Memoria</AppText>
          <AppText variant="small">Answers come from the photos you've saved.</AppText>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => <Bubble message={item} />}
          ListFooterComponent={
            thinking ? (
              <View style={[styles.bubble, styles.assistantBubble, styles.thinking]}>
                <ActivityIndicator color={colors.primary} />
                <AppText variant="small">Thinking…</AppText>
              </View>
            ) : messages.length === 1 ? (
              <View style={styles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <Pressable key={s} style={styles.chip} onPress={() => send(s)} accessibilityRole="button">
                    <AppText style={styles.chipText}>{s}</AppText>
                  </Pressable>
                ))}
              </View>
            ) : null
          }
        />

        <View style={styles.composer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your question…"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
            accessibilityLabel="Your question"
            multiline={false}
          />
          <Pressable
            onPress={() => send(input)}
            disabled={!input.trim() || thinking}
            style={({ pressed }) => [styles.send, (pressed || !input.trim()) && styles.sendDim]}
            accessibilityRole="button"
            accessibilityLabel="Send"
          >
            <Ionicons name="arrow-up" size={26} color={colors.onPrimary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  return (
    <View
      style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.assistantBubble,
        message.isError && styles.errorBubble,
      ]}
    >
      <AppText style={isUser ? styles.userText : message.isError ? styles.errorText : undefined}>{message.text}</AppText>
      {!!message.memories?.length && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
          {message.memories.map((m) => (
            <Image
              key={m.id}
              source={{ uri: memoryUri(m) }}
              style={styles.thumb}
              accessibilityLabel={m.caption}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm, gap: spacing.xs },
  list: { padding: spacing.lg, gap: spacing.md, maxWidth: 720, width: '100%', alignSelf: 'center' },
  bubble: { padding: spacing.md, borderRadius: radius.lg, maxWidth: '88%', gap: spacing.sm },
  userBubble: { alignSelf: 'flex-end', backgroundColor: colors.primary, borderBottomRightRadius: radius.sm },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: colors.surface, borderBottomLeftRadius: radius.sm },
  errorBubble: { backgroundColor: colors.dangerSoft },
  userText: { color: colors.onPrimary },
  errorText: { color: colors.danger },
  thinking: { flexDirection: 'row', alignItems: 'center' },
  thumbs: { gap: spacing.sm },
  thumb: { width: 120, height: 120, borderRadius: radius.md, backgroundColor: colors.surfaceMuted },
  suggestions: { gap: spacing.sm, alignItems: 'flex-start', marginTop: spacing.sm },
  chip: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  chipText: { color: colors.primary, fontWeight: '600' },
  composer: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    minHeight: touchTarget,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.lg,
    fontSize: fontSize.body,
    color: colors.text,
    backgroundColor: colors.background,
  },
  send: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: touchTarget / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendDim: { opacity: 0.6 },
});
