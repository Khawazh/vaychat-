'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Shield, Zap, Users } from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { SplashScreen } from '@/components/ui/SplashScreen';

export default function HomePage() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <AnimatePresence>{showSplash && <SplashScreen />}</AnimatePresence>

      <main className="relative min-h-[100dvh] overflow-hidden bg-black text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(209,31,31,0.1),transparent_50%)]" />

        <header className="relative z-10 flex items-center justify-between px-4 py-5 md:px-10">
          <Logo variant="dark" />
          <Link href="/auth" className="btn-primary rounded-full px-5 py-2.5 text-sm font-semibold">
            Войти
          </Link>
        </header>

        <section className="relative z-10 mx-auto max-w-lg px-6 pb-28 pt-8 text-center md:max-w-3xl md:pt-16">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <p className="text-xs uppercase tracking-[0.25em] text-red/80">VaiChat</p>
            <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">
              Связь <span className="text-green">без границ</span>
            </h1>
            <p className="mx-auto mt-5 max-w-md text-white/50">
              Премиальный мессенджер с символом солнца. Работает в браузере и на Android.
            </p>
            <Link
              href="/auth"
              className="btn-primary mt-10 inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold"
            >
              Открыть ВайЧат
              <ArrowRight className="h-5 w-5" />
            </Link>
          </motion.div>

          <motion.div
            className="mx-auto mt-14 premium-card p-5 text-left"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            {[
              { n: 'Адам', m: 'Салам!', t: '14:32' },
              { n: 'Семья', m: 'Фото', t: '12:01' },
            ].map((c) => (
              <div key={c.n} className="flex items-center gap-3 border-b border-white/5 py-3 last:border-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green/20 font-semibold text-green">
                  {c.n[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.n}</p>
                  <p className="truncate text-sm text-white/40">{c.m}</p>
                </div>
                <span className="text-xs text-white/30">{c.t}</span>
              </div>
            ))}
          </motion.div>
        </section>

        <section className="relative z-10 border-t border-white/5 px-6 py-12">
          <div className="mx-auto grid max-w-3xl gap-8 md:grid-cols-3">
            {[
              { icon: Zap, title: 'Быстро', desc: 'Realtime WebSocket' },
              { icon: Shield, title: 'Безопасно', desc: 'JWT + шифрование' },
              { icon: Users, title: 'Android', desc: 'PWA и приложение' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-green">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-white/40">{desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
