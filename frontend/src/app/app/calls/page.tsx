'use client';

import { motion } from 'framer-motion';
import { Phone, PhoneIncoming, PhoneOutgoing, Video } from 'lucide-react';

const CALLS = [
  { name: 'Адам М.', type: 'incoming', time: '14:32', missed: false },
  { name: 'Малик К.', type: 'outgoing', time: 'вчера', missed: false },
  { name: 'Неизвестный', type: 'incoming', time: 'пн', missed: true },
];

export default function CallsPage() {
  return (
    <div className="flex-1 overflow-y-auto">
      <header className="flex items-center justify-between px-6 py-6">
        <h1 className="text-xl font-bold text-dark dark:text-white">Звонки</h1>
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-green text-white"
          aria-label="Новый звонок"
        >
          <Phone className="h-5 w-5" />
        </button>
      </header>

      <div className="px-4 pb-4">
        <motion.button
          whileTap={{ scale: 0.98 }}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-green to-green-dark py-4 font-semibold text-white shadow-soft"
        >
          <Video className="h-5 w-5" />
          Начать видеозвонок
        </motion.button>
      </div>

      <p className="px-6 pb-2 text-xs font-medium uppercase tracking-wider text-dark/40">
        Недавние
      </p>

      <ul className="space-y-1 px-2">
        {CALLS.map((call, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-center gap-4 rounded-2xl px-4 py-3 hover:bg-green/5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green/10 font-semibold text-green">
              {call.name[0]}
            </div>
            <div className="flex-1">
              <p className={call.missed ? 'font-semibold text-red' : 'font-medium text-dark dark:text-white'}>
                {call.name}
              </p>
              <p className="flex items-center gap-1 text-xs text-dark/50">
                {call.type === 'incoming' ? (
                  <PhoneIncoming className="h-3 w-3" />
                ) : (
                  <PhoneOutgoing className="h-3 w-3" />
                )}
                {call.time}
              </p>
            </div>
            <button type="button" className="text-green" aria-label="Позвонить">
              <Phone className="h-5 w-5" />
            </button>
          </motion.li>
        ))}
      </ul>

      <p className="mt-8 px-6 text-center text-sm text-dark/40">
        Голосовые и видеозвонки — в Phase 2 (WebRTC)
      </p>
    </div>
  );
}
