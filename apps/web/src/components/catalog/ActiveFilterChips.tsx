'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FilterChip {
  key: string
  label: string
  onRemove: () => void
}

interface ActiveFilterChipsProps {
  filters: FilterChip[]
  onResetAll: () => void
  className?: string
}

export function ActiveFilterChips({ filters, onResetAll, className }: ActiveFilterChipsProps) {
  if (filters.length === 0) return null

  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <AnimatePresence mode="popLayout">
        {filters.map(filter => (
          <motion.button
            key={filter.key}
            layout
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            onClick={filter.onRemove}
            aria-label={`Убрать фильтр: ${filter.label}`}
            className="flex items-center gap-1.5 px-3 py-1 bg-[var(--color-caramel)]/10 border border-[var(--color-caramel)]/25 rounded-full text-xs text-[var(--color-caramel)] hover:bg-[var(--color-caramel)]/15 transition-colors"
          >
            {filter.label}
            <X size={12} className="opacity-60" />
          </motion.button>
        ))}
      </AnimatePresence>

      <button
        onClick={onResetAll}
        className="text-xs text-graphite-light underline hover:text-graphite transition-colors ml-1"
      >
        Сбросить всё
      </button>
    </div>
  )
}
