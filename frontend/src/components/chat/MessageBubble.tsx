'use client';

import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  id: string;
  content: string;
  time: string;
  isOwn: boolean;
  isRead?: boolean;
  senderName?: string;
  showSender?: boolean;
  isChannel?: boolean; // если true, выравниваем всегда влево
}

export function MessageBubble({
  content,
  time,
  isOwn,
  isRead,
  senderName,
  showSender,
  isChannel,
}: MessageBubbleProps) {
  const alignLeft = isChannel || !isOwn;

  return (
    <div className={cn('flex flex-col', alignLeft ? 'items-start' : 'items-end')}>
      {showSender && senderName && (
        <span className="text-xs text-green/80 mb-1 ml-2">{senderName}</span>
      )}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
          isChannel
            ? 'bg-white/10 text-white rounded-bl-xl' // канал – всегда левый стиль
            : isOwn
              ? 'bg-green/20 text-white rounded-br-xl'
              : 'bg-white/10 text-white rounded-bl-xl'
        )}
      >
        <p>{content}</p>
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[10px] text-white/40">
            {new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {isOwn && isRead && !isChannel && (
            <span className="text-[10px] text-green">✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
}
