import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { api, setApiBase, getApiBase } from '../lib/api';
import type { User } from '../types';

const COLORS = {
  black: '#000000',
  card: '#141414',
  green: '#0F8F3D',
  red: '#D11F1F',
  muted: 'rgba(255,255,255,0.45)',
};

export function AuthScreen({
  onAuth,
}: {
  onAuth: (user: User, access: string, refresh: string) => void;
}) {
  const [apiHost, setApiHost] = useState(getApiBase().replace('http://', ''));
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');

  function applyApiHost() {
    const host = apiHost.trim().replace(/^https?:\/\//, '');
    setApiBase(`http://${host}`);
  }

  async function sendOtp() {
    applyApiHost();
    setLoading(true);
    setError('');
    try {
      await api('/api/auth/otp/send', { method: 'POST', body: JSON.stringify({ phone }) });
      setStep('otp');
      try {
        const { code: c } = await api<{ code: string | null }>(
          `/api/auth/otp/dev?phone=${encodeURIComponent(phone.replace(/\D/g, ''))}`
        );
        if (c) {
          setCode(c);
          setHint(`Код: ${c}`);
        }
      } catch {
        setHint('Код в консоли ПК (backend)');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    applyApiHost();
    setLoading(true);
    setError('');
    try {
      const res = await api<{
        user: User;
        accessToken: string;
        refreshToken: string;
      }>('/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code, deviceName: 'Android' }),
      });
      onAuth(res.user, res.accessToken, res.refreshToken);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Image source={require('../../assets/logo.png')} style={styles.logo} />
        <Text style={styles.title}>ВайЧат</Text>
        <Text style={styles.sub}>IP компьютера с API (порт 4000)</Text>
        <TextInput
          style={styles.input}
          value={apiHost}
          onChangeText={setApiHost}
          placeholder="192.168.0.11:4000"
          placeholderTextColor={COLORS.muted}
          autoCapitalize="none"
        />

        {step === 'phone' ? (
          <>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+7 999 000 00 00"
              placeholderTextColor={COLORS.muted}
              keyboardType="phone-pad"
            />
            <TouchableOpacity style={styles.btnGreen} onPress={sendOtp} disabled={loading}>
              <Text style={styles.btnText}>{loading ? '...' : 'Получить код'}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TextInput
              style={[styles.input, styles.code]}
              value={code}
              onChangeText={setCode}
              placeholder="000000"
              placeholderTextColor={COLORS.muted}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity style={styles.btnRed} onPress={verify} disabled={loading || code.length !== 6}>
              <Text style={styles.btnText}>{loading ? '...' : 'Войти'}</Text>
            </TouchableOpacity>
          </>
        )}

        {!!error && <Text style={styles.err}>{error}</Text>}
        {!!hint && <Text style={styles.hint}>{hint}</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.black },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { width: 100, height: 100, alignSelf: 'center', borderRadius: 50 },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', textAlign: 'center', marginTop: 16 },
  sub: { color: COLORS.muted, fontSize: 12, textAlign: 'center', marginTop: 8, marginBottom: 16 },
  input: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 16,
    padding: 16,
    color: '#fff',
    marginBottom: 12,
    fontSize: 16,
  },
  code: { textAlign: 'center', letterSpacing: 8, fontSize: 24 },
  btnGreen: { backgroundColor: COLORS.green, borderRadius: 16, padding: 16, marginTop: 8 },
  btnRed: { backgroundColor: COLORS.red, borderRadius: 16, padding: 16, marginTop: 8 },
  btnText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontSize: 16 },
  err: { color: COLORS.red, textAlign: 'center', marginTop: 12 },
  hint: { color: COLORS.green, textAlign: 'center', marginTop: 12 },
});
