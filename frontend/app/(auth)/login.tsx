import { Link, router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { api, ApiError, errorMessage } from '@/api';
import { AppText, Button, Card, Notice, Screen, TextField } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, fontSize } from '@/theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email.trim() || !password) return setError('Please enter your email and password.');
    setBusy(true);
    setError(null);
    try {
      await login(email.trim(), password);
      // The (auth) layout redirects to the app once the user is set.
    } catch (err) {
      if (err instanceof ApiError && err.status === 403 && typeof err.data.account_id === 'number') {
        // Account exists but was never verified: send a fresh code and continue there.
        const accountId = err.data.account_id;
        await api.auth.resend(accountId).catch(() => {});
        router.push({ pathname: '/verify/[accountId]', params: { accountId: String(accountId), email } });
      } else {
        setError(errorMessage(err));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <AppText variant="title">Welcome back</AppText>
      <AppText variant="muted">Log in to see your memories.</AppText>
      <Card>
        {error && <Notice>{error}</Notice>}
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
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          textContentType="password"
          onSubmitEditing={submit}
        />
        <Button title="Log in" icon="log-in" onPress={submit} loading={busy} />
      </Card>
      <Link href="/signup" style={styles.link}>
        New to Memoria? Create an account
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: { color: colors.primary, fontSize: fontSize.body, fontWeight: '700', textAlign: 'center', padding: 12 },
});
