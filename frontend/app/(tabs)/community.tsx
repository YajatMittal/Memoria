import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { api, errorMessage, ForumPost } from '@/api';
import { AppText, Button, Card, EmptyState, Notice, Screen, TextField } from '@/components/ui';
import { colors, radius, shadow, spacing } from '@/theme';
import { timeAgo } from '@/utils/date';

export default function CommunityScreen() {
  const [posts, setPosts] = useState<ForumPost[] | null>(null);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api.forum
      .posts()
      .then((p) => {
        setPosts(p);
        setError(null);
      })
      .catch((err) => setError(errorMessage(err)));
  }, []);
  useFocusEffect(load);

  const publish = async () => {
    if (!title.trim() || !content.trim()) return setError('Please add a title and a message.');
    setBusy(true);
    setError(null);
    try {
      const post = await api.forum.create(title.trim(), content.trim());
      setPosts((prev) => [post, ...(prev ?? [])]);
      setTitle('');
      setContent('');
      setComposing(false);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppText variant="title">Community</AppText>
      <AppText variant="muted">
        A friendly space for people living with memory loss, families and caregivers to share tips and support.
      </AppText>

      {error && <Notice>{error}</Notice>}

      {composing ? (
        <Card>
          <AppText variant="heading">New post</AppText>
          <TextField label="Title" value={title} onChangeText={setTitle} maxLength={200} />
          <TextField label="Message" value={content} onChangeText={setContent} multiline maxLength={5000} />
          <Button title="Post" icon="send" onPress={publish} loading={busy} />
          <Button title="Cancel" variant="ghost" onPress={() => setComposing(false)} />
        </Card>
      ) : (
        <Button title="Write a post" icon="create" onPress={() => setComposing(true)} />
      )}

      {posts?.length === 0 && (
        <EmptyState icon="chatbubbles-outline" title="No posts yet" message="Be the first to start a conversation." />
      )}

      {posts?.map((post) => (
        <Pressable
          key={post.id}
          onPress={() => router.push({ pathname: '/community/[postId]', params: { postId: String(post.id) } })}
          style={({ pressed }) => [styles.post, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <AppText variant="heading">{post.title}</AppText>
          <AppText numberOfLines={3}>{post.content}</AppText>
          <View style={styles.meta}>
            <AppText variant="small">
              {post.author} · {timeAgo(post.created_at)}
            </AppText>
            <View style={styles.replies}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.textMuted} />
              <AppText variant="small">{post.comment_count}</AppText>
            </View>
          </View>
        </Pressable>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  post: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, ...shadow },
  pressed: { opacity: 0.85 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  replies: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
