'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface ConstructorSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToCart: () => void;
  onBuildAnother: () => void;
  screenshotUrl?: string;
  configSummary: string;
  totalPrice: number;
}

export function ConstructorSuccessModal({
  isOpen,
  onClose,
  onGoToCart,
  onBuildAnother,
  screenshotUrl,
  configSummary,
  totalPrice,
}: ConstructorSuccessModalProps) {
  // Body scroll lock + Escape key
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handler);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handler);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="success-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Dialog container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              key="success-modal"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              className="relative w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl sm:p-8"
              role="dialog"
              aria-modal="true"
              aria-label="Торт добавлен в корзину"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-graphite-light)] hover:bg-[var(--color-champagne)]/60 hover:text-[var(--color-graphite)] transition-colors duration-150"
                aria-label="Закрыть"
              >
                <X size={20} />
              </button>

              {/* Icon + Title */}
              <div className="mb-5 flex flex-col items-center gap-3 text-center">
                <CheckCircle
                  size={44}
                  strokeWidth={1.75}
                  className="text-[var(--color-caramel)]"
                />
                <h2 className="font-heading text-xl font-semibold text-[var(--color-graphite)]">
                  Торт добавлен в корзину!
                </h2>
              </div>

              {/* Screenshot preview */}
              <div className="relative mb-4 aspect-square overflow-hidden rounded-xl bg-[var(--color-warm-ivory)]">
                {screenshotUrl ? (
                  <Image
                    src={screenshotUrl}
                    alt="Превью торта"
                    fill
                    unoptimized
                    sizes="320px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-6xl">
                    🎂
                  </div>
                )}
              </div>

              {/* Config summary */}
              {configSummary && (
                <p className="mb-2 text-center text-sm text-[var(--color-graphite-light)]">
                  {configSummary}
                </p>
              )}

              {/* Price */}
              <p className="mb-6 text-center text-xl font-semibold text-[var(--color-caramel)]">
                {formatPrice(totalPrice)}
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={onGoToCart}
                  className="w-full rounded-full bg-[var(--color-caramel)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--color-caramel-hover)]"
                >
                  Перейти в корзину
                </button>
                <button
                  onClick={onBuildAnother}
                  className="text-sm font-medium text-[var(--color-graphite-light)] transition-colors hover:text-[var(--color-graphite)]"
                >
                  Собрать ещё
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
