'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { BottomNav } from '@/components/layout/BottomNav';
import { useAuthStore } from '@/store/auth';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) router.replace('/auth');
  }, [user, router]);

  if (!user) return null;

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-black text-white">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </div>
      <BottomNav />
    </div>
  );
}