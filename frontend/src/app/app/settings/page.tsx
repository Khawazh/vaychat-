'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Bell,
  Lock,
  Moon,
  Shield,
  Smartphone,
  LogOut,
  ChevronRight,
  Globe,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

const SETTINGS = [
  { icon: Bell, label: 'Уведомления', desc: 'Push и звуки' },
  { icon: Lock, label: 'Конфиденциальность', desc: 'Последний визит, номер' },
  { icon: Shield, label: 'Безопасность', desc: 'E2E, сессии устройств' },
  { icon: Smartphone, label: 'Устройства', desc: 'Активные сессии' },
  { icon: Globe, label: 'Язык', desc: 'Русский' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { isDark, toggleTheme, logout } = useAuthStore();

  return (
    <div className="flex-1 overflow-y-auto pb-8">
      <header className="px-6 py-6">
        <h1 className="text-xl font-bold text-dark dark:text-white">Настройки</h1>
      </header>

      <div className="mx-4 mb-6 glass-panel rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green/10 text-green">
              <Moon className="h-5 w-5" />
            </div>
            <div>
              <p className="font-medium text-dark dark:text-white">Тёмная тема</p>
              <p className="text-xs text-dark/50">#0F1115 фон</p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className={`relative h-7 w-12 rounded-full transition ${isDark ? 'bg-green' : 'bg-dark/20'}`}
            aria-pressed={isDark}
          >
            <motion.span
              className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
              animate={{ left: isDark ? 26 : 4 }}
              transition={{ type: 'spring', stiffness: 500 }}
            />
          </button>
        </div>
      </div>

      <ul className="mx-4 space-y-2">
        {SETTINGS.map(({ icon: Icon, label, desc }) => (
          <li key={label}>
            <button
              type="button"
              className="flex w-full items-center gap-4 rounded-2xl px-4 py-3 transition hover:bg-green/5"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green/10 text-green">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-dark dark:text-white">{label}</p>
                <p className="text-xs text-dark/50">{desc}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-dark/30" />
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => {
          logout();
          router.push('/');
        }}
        className="mx-4 mt-8 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-2xl border border-red/30 py-4 font-medium text-red transition hover:bg-red/5"
      >
        <LogOut className="h-5 w-5" />
        Выйти из аккаунта
      </button>

      <p className="mt-6 text-center text-xs text-dark/30">ВайЧат v0.1.0 MVP</p>
    </div>
  );
}
