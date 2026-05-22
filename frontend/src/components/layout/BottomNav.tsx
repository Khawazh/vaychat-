'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, Phone, Settings, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const tabs = [
  { href: '/app/chats', icon: MessageCircle, label: 'Чаты' },
  { href: '/app/calls', icon: Phone, label: 'Звонки' },
  { href: '/app/profile', icon: User, label: 'Профиль' },
  { href: '/app/settings', icon: Settings, label: 'Ещё' },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="glass-panel fixed bottom-0 left-0 right-0 z-40 mx-3 mb-3 rounded-2xl px-1 py-1 safe-bottom md:hidden">
      <ul className="flex justify-around">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'relative flex flex-col items-center gap-0.5 px-3 py-2 text-[10px]',
                  active ? 'text-red' : 'text-white/45'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="nav-pill"
                    className="absolute inset-0 rounded-xl bg-red/10"
                  />
                )}
                <Icon className="relative z-10 h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                <span className="relative z-10">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
