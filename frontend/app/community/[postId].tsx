import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { api, errorMessage, ForumComment, ForumPost } from '@/api';
import { AppText, Button, Card, Notice, Screen, TextField } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';
import { timeAgo } from '@/utils/date';

export default function PostScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const [post, setPost] = useState<ForumPost | null>(null);
  const [comments, setComments] = useState<ForumComment[]>([]);
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.forum
      .post(Number(postId))
      .then((data) => {
        setPost(data.post);
        setComments(data.comments);
      })
      .catch((err) => setError(errorMessage(err)));
  }, [postId]);

  const send = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const comment = await api.forum.comment(Number(postId), reply.trim());
      setComments((prev) => [...prev, comment]);
      setReply('');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!post) {
    return (
      <Screen withHeader>{error ? <Notice>{error}</Notice> : <ActivityIndicator color={colors.primary} size="large" />}</Screen>
    );
  }

  return (
    <Screen withHeader>
      <Card>
        <AppText variant="heading">{post.title}</AppText>
        <AppText variant="small">
          {post.author} · {timeAgo(post.created_at)}
        </AppText>
        <AppText>{post.content}</AppText>
      </Card>

      <AppText variant="heading">
        {comments.length === 0 ? 'No replies yet' : `${comments.length} ${comments.length === 1 ? 'reply' : 'replies'}`}
      </AppText>
      {comments.map((c) => (
        <View key={c.id} style={styles.comment}>
          <AppText variant="small">
            {c.author} · {timeAgo(c.created_at)}
          </AppText>
          <AppText>{c.content}</AppText>
        </View>
      ))}

      <Card>
        {error && <Notice>{error}</Notice>}
        <TextField label="Write a reply" value={reply} onChangeText={setReply} multiline maxLength={2000} />
        <Button title="Reply" icon="send" onPress={send} loading={busy} disabled={!reply.trim()} />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  comment: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.xs,
    borderLeftWidth: 4,
    borderLeftColor: colors.surfaceMuted,
  },
});
