'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchClient } from '@/lib/api';
import { OrderCard, type Order } from '@/components/account/OrderCard';

// ---------- Skeleton ----------

function OrderSkeleton() {
  return (
    <div className="rounded-xl border border-[var(--color-toffee)]/60 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-9 w-9 animate-pulse rounded-lg bg-[var(--color-warm-ivory)]" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-warm-ivory)]" />
          <div className="h-3 w-20 animate-pulse rounded bg-[var(--color-warm-ivory)]" />
        </div>
        <div className="h-6 w-20 animate-pulse rounded-full bg-[var(--color-warm-ivory)]" />
      </div>
    </div>
  );
}

// ---------- Empty state ----------

function EmptyOrders() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-20 text-center">
      <span className="text-5xl mb-4" aria-hidden="true">🎂</span>
      <p className="text-neutral-500 mb-6">У вас пока нет заказов</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/catalog"
          className="inline-flex items-center justify-center rounded-full bg-[var(--color-caramel)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--color-caramel-hover)]"
        >
          В каталог
        </Link>
        <Link
          href="/constructor"
          className="inline-flex items-center justify-center rounded-full border border-[var(--color-champagne)] px-6 py-3 text-sm font-medium text-[var(--color-graphite)] transition-colors hover:bg-[var(--color-champagne)]/40"
        >
          Собрать торт в 3D
        </Link>
      </div>
    </div>
  );
}

// ---------- Page ----------

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClient<Order[]>('/orders')
      .then((res) => {
        const mapped = (res.data ?? []).map((order) => ({
          ...order,
          items: order.items.map((item: any) => {
            if (item.type === 'product') {
              return {
                ...item,
                name: item.productName ?? item.name ?? 'Товар',
                imageUrl: item.productImageUrl ?? item.imageUrl ?? undefined,
              };
            }
            return item;
          }),
        }));
        setOrders(mapped);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Не удалось загрузить заказы')
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold font-heading mb-8">
          Мои заказы
        </h1>
        {!loading && orders.length > 0 && (
          <span className="text-sm text-neutral-500">
            {orders.length} {orders.length === 1 ? 'заказ' : orders.length < 5 ? 'заказа' : 'заказов'}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <OrderSkeleton key={i} />
          ))}
        </div>
      ) : orders.length === 0 && !error ? (
        <EmptyOrders />
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
