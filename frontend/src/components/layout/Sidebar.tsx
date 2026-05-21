'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageCircle, Phone, Settings, User } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/utils';

const links = [
  { href: '/app/chats', icon: MessageCircle, label: 'Чаты' },
  { href: '/app/calls', icon: Phone, label: 'Звонки' },
  { href: '/app/profile', icon: User, label: 'Профиль' },
  { href: '/app/settings', icon: Settings, label: 'Настройки' },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-panel hidden h-full w-20 flex-col items-center border-r border-white/5 py-6 md:flex lg:w-64 lg:items-stretch lg:px-4">
      <div className="mb-8 lg:px-2">
        <Logo size="sm" variant="dark" showText={false} />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center justify-center gap-3 rounded-xl py-3 transition lg:justify-start lg:px-4',
                active
                  ? 'bg-red/15 text-red'
                  : 'text-white/50 hover:bg-white/5 hover:text-white'
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="hidden text-sm font-medium lg:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="accent-line mt-auto w-full opacity-60" />
    </aside>
  );
}
