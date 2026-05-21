'use client';

import { motion } from 'framer-motion';
import { Logo } from './Logo';

export function SplashScreen({ onComplete }: { onComplete?: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={() => onComplete?.()}
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(209,31,31,0.12)_0%,transparent_60%)]" />

      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
      >
        <Logo size="xl" variant="dark" />
      </motion.div>

      <motion.p
        className="mt-8 text-sm tracking-wide text-white/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        Быстро. Безопасно. По-нашему.
      </motion.p>

      <motion.div
        className="mt-12 h-0.5 w-40 overflow-hidden rounded-full bg-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <motion.div
          className="h-full rounded-full bg-red"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.6, ease: 'easeInOut' }}
        />
      </motion.div>
    </motion.div>
  );
}
