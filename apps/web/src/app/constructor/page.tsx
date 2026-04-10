'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import { useConstructorStore } from '@/stores/constructor-store';

// Dynamically import the layout with SSR disabled — it contains WebGL canvas
const ConstructorLayout = dynamic(
  () =>
    import('@/components/constructor/ConstructorLayout').then(
      (mod) => mod.ConstructorLayout
    ),
  {
    ssr: false,
    loading: () => <ConstructorPageSkeleton />,
  }
);

function ConstructorPageSkeleton() {
  return (
    <div className="hidden lg:grid lg:grid-cols-[3fr_2fr] h-[calc(100dvh-64px)] animate-pulse">
      {/* Viewport skeleton */}
      <div className="bg-gradient-to-b from-gray-100 to-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          {/* Cake tiers silhouette */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-20 h-6 rounded-full bg-gray-200" />
            <div className="w-28 h-8 rounded-full bg-gray-200" />
            <div className="w-36 h-10 rounded-full bg-gray-200" />
          </div>
          <div className="w-48 h-3 rounded-full bg-gray-200" />
          <div className="w-32 h-3 rounded-full bg-gray-200" />
        </div>
      </div>

      {/* Panel skeleton */}
      <div className="border-l border-[var(--color-champagne)] bg-[var(--color-warm-ivory)] flex flex-col">
        {/* Progress bar skeleton */}
        <div className="px-4 py-4 bg-white border-b border-gray-100 flex items-center justify-between">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <div className="w-10 h-2 rounded-full bg-gray-200" />
            </div>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="flex-1 p-4 flex flex-col gap-4">
          <div className="h-4 w-24 bg-gray-200 rounded-full" />
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-gray-200" />
            ))}
          </div>
          <div className="h-4 w-32 bg-gray-200 rounded-full mt-2" />
          <div className="h-12 rounded-xl bg-gray-200" />
        </div>

        {/* Bottom skeleton */}
        <div className="border-t border-gray-100 p-4 flex flex-col gap-3">
          <div className="h-12 rounded-xl bg-gray-200" />
          <div className="h-11 rounded-lg bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

export default function ConstructorPage() {
  const loadIngredients = useConstructorStore((s) => s.loadIngredients);
  const currentStep = useConstructorStore((s) => s.currentStep);
  const layers = useConstructorStore((s) => s.layers);
  const decorations = useConstructorStore((s) => s.decorations);
  const inscription = useConstructorStore((s) => s.inscription);

  // Config is considered dirty when the user has progressed beyond step 1,
  // selected any layer ingredient, added decorations, or typed an inscription.
  const isDirty =
    currentStep > 1 ||
    layers.some((l) => l.baseId !== '' || l.fillingId !== '') ||
    decorations.length > 0 ||
    inscription.trim() !== '';

  useEffect(() => {
    loadIngredients();
  }, [loadIngredients]);

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return (
    <main className="overflow-hidden">
      <ConstructorLayout />
    </main>
  );
}
