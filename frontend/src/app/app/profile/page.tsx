'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Edit3 } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { api } from '@/lib/api';

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    setAvatarLoading(true);
    try {
      // Читаем файл как base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        // Отправляем base64 на сервер
        const res = await api<{ user: { avatarUrl: string } }>('/api/users/me', {
          method: 'PATCH',
          token: accessToken,
          body: JSON.stringify({ avatarBase64: base64 }),
        });
        // Обновляем пользователя в сторе
        setAuth(
          { ...user!, avatarUrl: res.user.avatarUrl },
          accessToken,
          useAuthStore.getState().refreshToken!
        );
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error('Avatar error:', err.message);
    } finally {
      setAvatarLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!accessToken) return;
    try {
      const res = await api<{ user: typeof user }>('/api/users/me', {
        method: 'PATCH',
        token: accessToken,
        body: JSON.stringify({
          displayName: displayName.trim() || undefined,
          username: username.trim() || undefined,
          bio: bio.trim() || undefined,
        }),
      });
      setAuth(
        { ...user!, ...res.user },
        accessToken,
        useAuthStore.getState().refreshToken!
      );
      setEditMode(false);
    } catch (err: any) {
      console.error('Save error:', err.message);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <header className="relative overflow-hidden px-6 pb-8 pt-8">
        <div className="absolute inset-0 bg-gradient-to-b from-green/15 to-transparent" />
        <h1 className="relative text-xl font-bold text-white">Профиль</h1>
      </header>

      <motion.div className="mx-auto max-w-md px-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="relative mx-auto mb-6 w-fit">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Аватар"
              className="h-28 w-28 rounded-full object-cover shadow-glass"
            />
          ) : (
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-green to-green-dark text-4xl font-bold text-white">
              {(user?.displayName ?? user?.phone ?? '?').charAt(0).toUpperCase()}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={avatarLoading}
            className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-red text-white"
          >
            {avatarLoading ? '...' : <Camera className="h-4 w-4" />}
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>

        {!editMode ? (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">{user?.displayName ?? 'Пользователь'}</h2>
              <p className="text-green">@{user?.username ?? 'username'}</p>
              <p className="text-sm text-white/50">{user?.bio ?? 'Добавьте описание'}</p>
              <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-green/10 px-3 py-1 text-xs font-medium text-green">
                <span className="h-2 w-2 rounded-full bg-green animate-pulse" /> в сети
              </span>
            </div>
            <button
              onClick={() => setEditMode(true)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl border border-green/30 py-3 text-green"
            >
              <Edit3 className="h-4 w-4" /> Редактировать
            </button>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-4">
            <div>
              <label className="text-sm text-white/60">Имя</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 mt-1 text-white outline-none" />
            </div>
            <div>
              <label className="text-sm text-white/60">Username</label>
              <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 mt-1 text-white outline-none" />
            </div>
            <div>
              <label className="text-sm text-white/60">О себе</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 mt-1 text-white outline-none resize-none" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditMode(false)} className="flex-1 rounded-2xl border border-white/20 py-3 text-white/60">Отмена</button>
              <button onClick={handleSave} className="flex-1 btn-secondary rounded-2xl py-3">Сохранить</button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
