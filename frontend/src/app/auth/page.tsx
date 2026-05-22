'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';
import { Logo } from '@/components/ui/Logo';

export default function AuthPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body: any = { username, password };
      if (!isLogin) body.displayName = displayName;

      const res = await api<{
        user: { id: string; username: string; displayName?: string; avatarUrl?: string; bio?: string };
        accessToken: string;
        refreshToken: string;
      }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      setAuth(res.user, res.accessToken, res.refreshToken);
      router.push('/app/chats');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-black p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-sm rounded-2xl p-6"
      >
        <div className="mb-6 flex justify-center">
          <Logo variant="dark" />
        </div>

        <h1 className="mb-4 text-center text-xl font-bold text-white">
          {isLogin ? 'Welcome back' : 'Create account'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
            required
          />
          {!isLogin && (
            <input
              type="text"
              placeholder="Display name (optional)"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none"
            />
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red/10 rounded-xl px-4 py-2">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-2xl bg-green py-3 font-semibold text-white"
          >
            {isLogin ? 'Sign in' : 'Sign up'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-white/50">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{' '}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-green underline"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
