import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { api, errorMessage } from '@/api';
import { AppText, Button, Card, Notice, Screen, TextField } from '@/components/ui';
import { colors, fontSize } from '@/theme';

export default function SignupScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!username.trim() || !email.trim() || !password) return setError('Please fill in every field.');
    if (password.length < 8) return setError('Your password needs at least 8 characters.');
    setBusy(true);
    setError(null);
    try {
      const { account_id } = await api.auth.signup(email.trim(), username.trim(), password);
      router.push({ pathname: '/verify/[accountId]', params: { accountId: String(account_id), email: email.trim() } });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppText variant="title">Create your account</AppText>
      <AppText variant="muted">It only takes a minute. We'll email you a code to confirm it's you.</AppText>
      <Card>
        {error && <Notice>{error}</Notice>}
        <TextField
          label="Name to show"
          hint="3–30 letters or numbers. Others see this in the community."
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoComplete="username"
        />
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
        />
        <TextField
          label="Password"
          hint="At least 8 characters."
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          textContentType="newPassword"
          onSubmitEditing={submit}
        />
        <Button title="Create account" icon="person-add" onPress={submit} loading={busy} />
      </Card>
      <Link href="/login" style={styles.link}>
        Already have an account? Log in
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: { color: colors.primary, fontSize: fontSize.body, fontWeight: '700', textAlign: 'center', padding: 12 },
});
