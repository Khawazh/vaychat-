'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Logo } from '@/components/ui/Logo';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

export default function AuthPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devHint, setDevHint] = useState('');

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await authApi.sendOtp(phone);
      setStep('otp');
      setDevHint('');
      try {
        const { code: devCode } = await authApi.getDevOtp(phone);
        if (devCode) {
          setCode(devCode);
          setDevHint(`Код: ${devCode}`);
        }
      } catch {
        /* ignore */
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await authApi.verifyOtp(phone, code, 'Mobile Web');
      setAuth(result.user, result.accessToken, result.refreshToken);
      router.push('/app/chats');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неверный код');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-black p-4 safe-bottom">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(15,143,61,0.08),transparent_50%)]" />

      <motion.div
        className="relative w-full max-w-md premium-card p-8"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8 flex justify-center">
          <Logo size="lg" variant="dark" />
        </div>

        <h1 className="text-center text-2xl font-bold text-white">
          {step === 'phone' ? 'Вход' : 'Код из SMS'}
        </h1>
        <p className="mt-2 text-center text-sm text-white/45">
          {step === 'phone' ? 'Номер телефона' : phone}
        </p>

        {error && (
          <p className="mt-4 rounded-xl bg-red/15 px-4 py-2 text-center text-sm text-red-light">
            {error}
          </p>
        )}
        {devHint && (
          <p className="mt-4 rounded-xl bg-green/15 px-4 py-2 text-center text-sm font-medium text-green-light">
            {devHint}
          </p>
        )}

        {step === 'phone' ? (
          <form onSubmit={handleSendOtp} className="mt-8 space-y-4">
            <input
              type="tel"
              placeholder="+7 999 000 00 00"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-4 text-lg text-white outline-none focus:border-green/50 focus:ring-2 focus:ring-green/20"
              required
              autoComplete="tel"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-secondary w-full rounded-2xl py-4 font-semibold disabled:opacity-50"
            >
              {loading ? 'Отправка...' : 'Получить код'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="mt-8 space-y-4">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-4 text-center text-2xl tracking-[0.4em] text-white outline-none focus:border-red/40"
              required
            />
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="btn-primary w-full rounded-2xl py-4 font-semibold disabled:opacity-50"
            >
              {loading ? 'Вход...' : 'Войти в ВайЧат'}
            </button>
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="w-full text-sm text-white/50"
            >
              Изменить номер
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
