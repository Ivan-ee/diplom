'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Dynamically import the actual Canvas wrapper to avoid SSR issues with WebGL
const CakeCanvasInner = dynamic(() => import('./CakeCanvasInner'), {
  ssr: false,
  loading: () => <ViewportSkeleton />,
});

function ViewportSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
      <div className="flex flex-col items-center gap-4">
        {/* Animated cake silhouette placeholder */}
        <div className="relative">
          <div className="w-32 h-8 rounded-full bg-[var(--color-toffee)]/40 animate-pulse" />
          <div className="w-24 h-8 rounded-full bg-[var(--color-toffee)]/40 animate-pulse mx-auto mt-1" />
          <div className="w-16 h-6 rounded-full bg-[var(--color-toffee)]/40 animate-pulse mx-auto mt-1" />
        </div>
        <p className="text-sm text-[var(--color-graphite-light)] font-body animate-pulse">
          Загрузка 3D-конструктора...
        </p>
      </div>
    </div>
  );
}

interface CakeViewportProps {
  className?: string;
}

export function CakeViewport({ className }: CakeViewportProps) {
  return (
    <div
      className={cn(
        'relative w-full h-full overflow-hidden bg-gradient-to-b from-gray-50 to-white',
        className
      )}
    >
      <ErrorBoundary
        fallback={
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-50 to-white">
            <div className="flex flex-col items-center gap-3 text-center px-4">
              <ViewportSkeleton />
              <p className="text-sm text-[var(--color-graphite-light)]">
                3D-просмотр недоступен
              </p>
            </div>
          </div>
        }
      >
        <Suspense fallback={<ViewportSkeleton />}>
          <CakeCanvasInner />
        </Suspense>
      </ErrorBoundary>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none">
        <p className="text-xs text-[var(--color-graphite-light)] bg-[var(--color-milk-white)]/70 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
          Вращайте мышью · Прокрутите для зума
        </p>
      </div>
    </div>
  );
}
