import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const isTruncated = items.length > 3;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items
      .filter((item) => item.href !== undefined)
      .map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.label,
        item: item.href,
      })),
  };

  return (
    <nav aria-label="Навигация" className={cn(className)}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ol className="flex items-center gap-1.5 flex-wrap">
        {items.map((item, index) => {
          const isFirst = index === 0;
          const isLast = index === items.length - 1;
          const isMiddle = !isFirst && !isLast;

          // Visibility logic for mobile truncation:
          // - first item: always visible
          // - middle items: hidden on mobile, visible on sm+
          // - last item: always visible
          const liClass = isMiddle ? 'hidden sm:flex items-center gap-1.5' : 'flex items-center gap-1.5';

          return (
            <li key={`${item.label}-${index}`} className={liClass}>
              {/* Separator before every item except the first */}
              {!isFirst && (
                <ChevronRight
                  size={12}
                  className="text-[var(--color-champagne)] shrink-0"
                  aria-hidden="true"
                />
              )}

              {isLast ? (
                <span
                  className="text-[var(--color-graphite)] font-medium text-sm"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href!}
                  className="text-[var(--color-graphite-light)]/60 hover:text-[var(--color-graphite)] transition-colors duration-150 text-sm"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}

        {/* Mobile ellipsis: shown between first and last when truncated */}
        {isTruncated && (
          <li className="flex sm:hidden items-center gap-1.5" aria-hidden="true">
            <ChevronRight
              size={12}
              className="text-[var(--color-champagne)] shrink-0"
            />
            <span className="text-[var(--color-graphite-light)]/60 text-sm select-none">
              ...
            </span>
          </li>
        )}
      </ol>
    </nav>
  );
}
