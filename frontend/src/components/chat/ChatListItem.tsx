'use client';

import { motion } from 'framer-motion';
import { cn, formatTime } from '@/lib/utils';
import { useUsersStatusStore } from '@/store/usersStatusStore';
import { Radio } from 'lucide-react'; // иконка канала

interface ChatListItemProps {
  id: string;
  title: string;
  lastMessage?: string;
  time?: string;
  unread?: number;
  online?: boolean;
  avatar?: string;
  active?: boolean;
  onClick?: () => void;
  participantId?: string;
  type?: string; // 'CHANNEL' и т.д.
}

function getLastSeenText(lastSeenAt?: string): string | null {
  if (!lastSeenAt) return null;
  const minutes = Math.floor((Date.now() - new Date(lastSeenAt).getTime()) / 60000);
  if (minutes < 1) return 'только что';
  if (minutes < 60) return `${minutes} мин. назад`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ч. назад`;
  return new Date(lastSeenAt).toLocaleDateString();
}

export function ChatListItem({
  title,
  lastMessage,
  time,
  unread = 0,
  online,
  active,
  onClick,
  participantId,
  type,
}: ChatListItemProps) {
  const userStatus = participantId ? useUsersStatusStore((s) => s.statuses[participantId]) : null;
  const isOnline = userStatus?.online ?? online;
  const lastSeenAt = userStatus?.lastSeenAt;
  const isChannel = type === 'CHANNEL';

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition',
        active ? 'bg-red/10' : 'hover:bg-white/5'
      )}
      whileTap={{ scale: 0.98 }}
    >
      <div className="relative shrink-0">
        <div className={cn(
          'flex h-12 w-12 items-center justify-center rounded-full text-lg font-semibold',
          isChannel
            ? 'bg-yellow/20 text-yellow'
            : 'bg-gradient-to-br from-green/20 to-green/5 text-green'
        )}>
          {isChannel ? <Radio className="h-5 w-5" /> : title.charAt(0).toUpperCase()}
        </div>
        {isOnline && !isChannel && (
          <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green dark:border-dark-card" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold text-white">{title}</span>
          {time && (
            <span className="shrink-0 text-xs text-white/40">
              {formatTime(time)}
            </span>
          )}
        </div>
        {!isChannel && (
          <p className="truncate text-sm text-white/50">
            {isOnline ? 'в сети' : getLastSeenText(lastSeenAt) ?? 'был(а) недавно'}
          </p>
        )}
        {isChannel && (
          <p className="truncate text-sm text-yellow/60">канал</p>
        )}
        {lastMessage && (
          <p className="truncate text-sm text-white/40">{lastMessage}</p>
        )}
      </div>
      {unread > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red px-1.5 text-xs font-bold text-white">
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </motion.button>
  );
}
