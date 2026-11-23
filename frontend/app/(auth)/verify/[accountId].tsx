import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';

import { api, errorMessage } from '@/api';
import { AppText, Button, Card, Notice, Screen } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { colors, radius } from '@/theme';

const RESEND_COOLDOWN_S = 30;

export default function VerifyScreen() {
  const { accountId, email } = useLocalSearchParams<{ accountId: string; email?: string }>();
  const { verify } = useAuth();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_S);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const submit = async (value = code) => {
    if (value.length !== 6) return setError('Please enter all 6 digits.');
    setBusy(true);
    setError(null);
    try {
      await verify(Number(accountId), value);
      // Success: the (auth) layout redirects into the app.
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      await api.auth.resend(Number(accountId));
      setInfo('We sent you a new code.');
      setCooldown(RESEND_COOLDOWN_S);
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <Screen>
      <AppText variant="title">Check your email</AppText>
      <AppText variant="muted">
        We sent a 6-digit code to {email ? <AppText style={styles.bold}>{email}</AppText> : 'your email'}. It expires in
        10 minutes.
      </AppText>
      <Card>
        {error && <Notice>{error}</Notice>}
        {info && !error && <Notice tone="success">{info}</Notice>}
        <TextInput
          value={code}
          onChangeText={(text) => {
            const digits = text.replace(/\D/g, '').slice(0, 6);
            setCode(digits);
            if (digits.length === 6) submit(digits);
          }}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          autoFocus
          maxLength={6}
          placeholder="••••••"
          placeholderTextColor={colors.border}
          accessibilityLabel="6-digit verification code"
          style={styles.code}
        />
        <Button title="Verify" icon="checkmark-circle" onPress={() => submit()} loading={busy} />
        <Button
          title={cooldown > 0 ? `Send a new code (${cooldown}s)` : 'Send a new code'}
          variant="ghost"
          onPress={resend}
          disabled={cooldown > 0}
        />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: '700' },
  code: {
    fontSize: 36,
    letterSpacing: 14,
    textAlign: 'center',
    fontWeight: '700',
    color: colors.text,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    backgroundColor: colors.surface,
  },
});
