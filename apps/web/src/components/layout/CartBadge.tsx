'use client';

import { useCartStore } from '@/stores/cart-store';
import { motion, AnimatePresence } from 'framer-motion';

export function CartBadge() {
  const count = useCartStore((s) => s.getTotalItems());

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.span
          key={count}
          initial={{ scale: 0 }}
          animate={{ scale: [1.2, 1] }}
          exit={{ scale: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-dusty-rose)] text-white text-[10px] font-semibold leading-none select-none pointer-events-none"
        >
          {count > 99 ? '99+' : count}
        </motion.span>
      )}
    </AnimatePresence>
  );
}
