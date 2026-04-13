'use client';

import { useEffect, useCallback } from 'react';
import { create } from 'zustand';

// Zustand micro-store so it can be accessed from anywhere
const useSearchDialogStore = create<{
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
}));

/**
 * Hook for SearchDialog state + Cmd+K / Ctrl+K global shortcut.
 * Use in Header to register the shortcut + control the dialog.
 */
export function useSearchDialog() {
  const { isOpen, open, close, toggle } = useSearchDialogStore();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [toggle]);

  return { isOpen, open, close, toggle };
}
