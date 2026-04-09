'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingBag, Clock, TrendingUp, RefreshCw, ArrowRight } from 'lucide-react';
import { fetchClient } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ---------- Types ----------

type RecentOrder = {
  id: string;
  orderNumber: number;
  status: 'created' | 'accepted' | 'preparing' | 'ready' | 'picked_up' | 'completed' | 'cancelled';
  totalPrice: number;
  createdAt: string;
};

type DashboardStats = {
  newOrdersToday: number;
  ordersInProgress: number;
  totalRevenue: number;
  recentOrders: RecentOrder[];
};

// ---------- Status config ----------

const STATUS_CONFIG: Record<
  RecentOrder['status'],
  { label: string; badgeVariant: 'default' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'outline' }
> = {
  created:   { label: 'Новый',     badgeVariant: 'secondary' },
  accepted:  { label: 'Принят',    badgeVariant: 'info'      },
  preparing: { label: 'Готовится', badgeVariant: 'warning'   },
  ready:     { label: 'Готов',     badgeVariant: 'success'   },
  picked_up: { label: 'Забран',    badgeVariant: 'default'   },
  completed: { label: 'Завершён',  badgeVariant: 'success'   },
  cancelled: { label: 'Отменён',   badgeVariant: 'error'     },
};

// ---------- Helpers ----------

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}.${mm} ${hh}:${min}`;
}

// ---------- Stat card ----------

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  loading: boolean;
}

function StatCard({ label, value, icon: Icon, loading }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-[var(--color-soft-peach)]/60 bg-white px-5 py-4 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--color-dusty-rose)]/10">
        <Icon size={20} className="text-[var(--color-dusty-rose)]" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
          {label}
        </p>
        {loading ? (
          <div className="mt-1 h-6 w-20 animate-pulse rounded bg-[var(--color-cream)]" />
        ) : (
          <p className="font-heading text-xl font-bold text-[var(--color-dark)]">{value}</p>
        )}
      </div>
    </div>
  );
}

// ---------- Skeleton rows ----------

function RecentOrdersSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className={i % 2 === 1 ? 'bg-[var(--color-cream)]/30' : ''}>
          {Array.from({ length: 4 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded bg-[var(--color-cream)]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ---------- Page ----------

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    fetchClient<DashboardStats>('/admin/stats')
      .then((res) => setStats(res.data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Ошибка загрузки статистики'),
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-[var(--color-dark)]">Дашборд</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
            Сводка за сегодня
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
          Обновить
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Новые заказы"
          value={stats?.newOrdersToday ?? 0}
          icon={ShoppingBag}
          loading={loading}
        />
        <StatCard
          label="В работе"
          value={stats?.ordersInProgress ?? 0}
          icon={Clock}
          loading={loading}
        />
        <StatCard
          label="Выручка"
          value={stats ? formatPrice(stats.totalRevenue) : '—'}
          icon={TrendingUp}
          loading={loading}
        />
      </div>

      {/* Recent orders */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-soft-peach)]/60 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--color-soft-peach)]/60 px-5 py-3.5">
          <p className="font-heading text-sm font-bold text-[var(--color-dark)]">
            Последние заказы
          </p>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-xs font-medium text-[var(--color-dusty-rose)] hover:underline"
          >
            Все заказы
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
            <thead>
              <tr className="bg-[var(--color-cream)]/60">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  Дата
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  Сумма
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <RecentOrdersSkeleton />
              ) : !stats || stats.recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-sm text-[var(--color-text-secondary)]"
                  >
                    Заказов пока нет
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((order, idx) => {
                  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.created;
                  return (
                    <tr
                      key={order.id}
                      className={cn(
                        'border-t border-[var(--color-soft-peach)]/40 transition-colors duration-100 hover:bg-[var(--color-dusty-rose)]/5',
                        idx % 2 === 1 && 'bg-[var(--color-cream)]/20',
                      )}
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium text-[var(--color-text-secondary)]">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-dark)]">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-heading text-sm font-bold text-[var(--color-dusty-rose)]">
                        {formatPrice(order.totalPrice)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={statusCfg.badgeVariant}>{statusCfg.label}</Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
