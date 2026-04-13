'use client';

import { toast } from 'sonner';
import Link from 'next/link';

interface CartToastProps {
  name: string;
  image?: string;
  weight?: string;
}

export function showCartToast({ name, image, weight }: CartToastProps) {
  toast(
    <div className="flex items-center gap-3">
      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-[var(--color-champagne)]">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={name}
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-lg" aria-hidden="true">
            🎂
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-[var(--color-graphite)] break-words line-clamp-2">
          {name}{weight ? `, ${weight}` : ''}
        </p>
        <p className="text-xs text-[var(--color-graphite-light)]">Добавлен в корзину</p>
        <Link
          href="/cart"
          className="text-xs font-medium text-[var(--color-caramel)] hover:text-[var(--color-caramel-hover)] transition-colors"
        >
          Перейти в корзину →
        </Link>
      </div>
    </div>,
    { duration: 4000 }
  );
}
