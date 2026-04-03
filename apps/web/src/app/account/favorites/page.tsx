'use client';

import { Heart } from 'lucide-react';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';

function EmptyFavorites() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl bg-white py-20 shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-cream)]">
        <Heart size={28} className="text-[var(--color-dusty-rose)]" />
      </div>
      <h2 className="mt-4 font-heading text-lg font-semibold text-[var(--color-dark)]">
        Список избранного пуст
      </h2>
      <p className="mt-1.5 max-w-xs text-center text-sm text-[var(--color-text-secondary)]">
        Добавляйте понравившиеся товары в избранное, чтобы быстро их находить
      </p>
      <Link href="/catalog" className={buttonVariants({ size: 'sm', className: 'mt-6' })}>
        Перейти в каталог
      </Link>
    </div>
  );
}

export default function FavoritesPage() {
  // Favorites API is not yet implemented — show empty state
  const favorites: unknown[] = [];

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-lg font-semibold text-[var(--color-dark)]">
        Избранное
      </h2>

      {favorites.length === 0 ? (
        <EmptyFavorites />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Product cards will render here once favorites API is ready */}
        </div>
      )}
    </div>
  );
}
