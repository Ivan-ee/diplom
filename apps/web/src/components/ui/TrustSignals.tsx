import { Shield, Leaf, CreditCard, RefreshCw, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrustSignalsProps {
  variant: 'pdp' | 'cart' | 'checkout' | 'inline';
  className?: string;
}

interface TrustItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

const trustItems: TrustItem[] = [
  { icon: Shield,     title: 'Гарантия свежести',   description: 'Готовим в день выдачи' },
  { icon: Leaf,       title: 'Натуральный состав',   description: 'Без консервантов и красителей' },
  { icon: CreditCard, title: 'Оплата при получении', description: 'Наличные или перевод' },
  { icon: RefreshCw,  title: 'Гарантия качества',    description: 'Переделаем, если не понравится' },
];

export function TrustSignals({ variant, className }: TrustSignalsProps) {
  if (variant === 'pdp') {
    return (
      <ul className={cn('flex flex-col gap-3', className)}>
        {trustItems.map(({ icon: Icon, title, description }) => (
          <li key={title} className="flex items-start gap-3">
            <Icon
              size={18}
              className="text-[var(--color-caramel)] mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <div>
              <div className="text-sm font-medium text-[var(--color-graphite)]">{title}</div>
              <div className="text-xs text-[var(--color-graphite-light)]">{description}</div>
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (variant === 'cart') {
    const cartItems = trustItems.slice(0, 3);
    return (
      <ul className={cn('flex flex-col gap-1.5', className)}>
        {cartItems.map(({ icon: Icon, title }) => (
          <li key={title} className="flex items-center gap-2 text-xs text-[var(--color-graphite-light)]">
            <Icon size={14} className="text-[var(--color-caramel)] shrink-0" aria-hidden="true" />
            {title}
          </li>
        ))}
      </ul>
    );
  }

  if (variant === 'checkout') {
    return (
      <div
        className={cn(
          'flex flex-wrap items-center justify-center gap-x-6 gap-y-2 py-3 border-t border-[var(--border-default)]',
          className,
        )}
      >
        {trustItems.map(({ icon: Icon, title }) => (
          <div key={title} className="flex items-center gap-1.5 text-xs text-[var(--color-graphite-light)]">
            <Icon size={16} className="text-[var(--color-caramel)]" aria-hidden="true" />
            {title}
          </div>
        ))}
      </div>
    );
  }

  // variant === 'inline'
  return (
    <div className={cn('flex items-center gap-2 text-caption text-[var(--color-graphite-light)] flex-wrap', className)}>
      {trustItems.map(({ icon: Icon, title }, i) => (
        <>
          <span key={title} className="flex items-center gap-1">
            <Icon size={12} aria-hidden="true" />
            {title}
          </span>
          {i < trustItems.length - 1 && (
            <span key={`sep-${i}`} className="text-[var(--color-champagne)]">·</span>
          )}
        </>
      ))}
    </div>
  );
}
