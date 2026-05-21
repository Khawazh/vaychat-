import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

export function formatLastSeen(date: string | Date | null): string {
  if (!date) return 'был(а) давно';
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return 'был(а) только что';
  if (diff < 3600000) return `был(а) ${Math.floor(diff / 60000)} мин. назад`;
  return `был(а) ${d.toLocaleDateString('ru-RU')}`;
}
