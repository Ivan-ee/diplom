'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/cart-store';
import { motion, AnimatePresence } from 'framer-motion';

export function CartBadge() {
  const count = useCartStore((s) => s.getTotalItems());
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const displayCount = mounted ? count : 0;

  return (
    <AnimatePresence>
      {displayCount > 0 && (
        <motion.span
          key={displayCount}
          initial={{ scale: 0 }}
          animate={{ scale: [1.2, 1] }}
          exit={{ scale: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-dusty-rose)] text-white text-[10px] font-semibold leading-none select-none pointer-events-none"
        >
          {displayCount > 99 ? '99+' : displayCount}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
