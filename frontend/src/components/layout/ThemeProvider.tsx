'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isDark = useAuthStore((s) => s.isDark);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  return <>{children}</>;
}