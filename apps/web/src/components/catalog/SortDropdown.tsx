'use client';

import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortDropdownProps {
  options: { value: string; label: string }[];
  currentValue: string;
  defaultValue: string;
  onSelect: (value: string) => void;
}

export function SortDropdown({
  options,
  currentValue,
  defaultValue,
  onSelect,
}: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLabel =
    currentValue === defaultValue
      ? 'Сортировка'
      : (options.find((o) => o.value === currentValue)?.label ?? 'Сортировка');

  useEffect(() => {
    if (!isOpen) return;

    function handleMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  function handleSelect(value: string) {
    onSelect(value);
    setIsOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={cn(
          'px-4 h-[42px] rounded-[var(--radius-control)] border-[1.5px] border-[var(--border-default)]',
          'bg-[var(--surface-elevated)] text-[var(--color-graphite)] text-sm font-medium',
          'hover:border-[var(--color-caramel)] transition-all duration-150 cursor-pointer',
          'flex items-center gap-2',
        )}
      >
        {currentLabel}
        <ChevronDown
          size={14}
          className="transition-transform duration-150"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{
              duration: 0.15,
              ease: [0.23, 1, 0.32, 1],
            }}
            style={{ transformOrigin: 'top' }}
            className={cn(
              'absolute top-full left-0 mt-1.5 min-w-full w-max z-10',
              'rounded-[var(--radius-control)] border border-[var(--border-default)]',
              'bg-[var(--surface-elevated)] shadow-lg overflow-hidden',
            )}
          >
            {options.map((option) => {
              const isActive = option.value === currentValue;
              return (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      'w-full px-4 py-3 text-sm cursor-pointer flex items-center justify-between gap-3',
                      'hover:bg-[var(--surface-secondary)] transition-colors duration-100',
                      isActive
                        ? 'text-[var(--color-caramel)] font-semibold'
                        : 'text-[var(--color-graphite)]',
                    )}
                  >
                    {option.label}
                    {isActive && <Check size={14} />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
