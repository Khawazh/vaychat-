'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  variant?: 'light' | 'dark';
}

const sizes = { sm: 36, md: 48, lg: 72, xl: 120 };

export function Logo({
  size = 'md',
  showText = true,
  className,
  variant = 'dark',
}: LogoProps) {
  const px = sizes[size];
  const isDark = variant === 'dark';

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <motion.div
        className="relative shrink-0 overflow-hidden rounded-full shadow-lg ring-1 ring-white/20"
        style={{ width: px, height: px }}
        whileHover={{ scale: 1.04 }}
        transition={{ type: 'spring', stiffness: 400 }}
      >
        <Image
          src="/logo.png"
          alt="ВайЧат"
          width={px}
          height={px}
          className="h-full w-full object-cover"
          priority
        />
      </motion.div>
      {showText && (
        <div>
          <span
            className={cn(
              'text-xl font-bold tracking-tight',
              isDark ? 'text-white' : 'text-dark'
            )}
          >
            Вай<span className="text-green">Чат</span>
          </span>
          <p
            className={cn(
              'text-[10px] uppercase tracking-[0.2em]',
              isDark ? 'text-white/45' : 'text-dark/45'
            )}
          >
            Messenger
          </p>
        </div>
      )}
    </div>
  );
}
