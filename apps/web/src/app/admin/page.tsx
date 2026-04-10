'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { ShoppingBag, Clock, TrendingUp, RefreshCw, ArrowRight } from 'lucide-react';
import { fetchClient } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';

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
  { label: string; color: string }
> = {
  created:   { label: 'Новый',     color: 'bg-neutral-100 text-neutral-600' },
  accepted:  { label: 'Принят',    color: 'bg-blue-100 text-blue-700'       },
  preparing: { label: 'Готовится', color: 'bg-amber-100 text-amber-700'     },
  ready:     { label: 'Готов',     color: 'bg-emerald-100 text-emerald-700' },
  picked_up: { label: 'Забран',    color: 'bg-neutral-100 text-neutral-600' },
  completed: { label: 'Завершён',  color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Отменён',   color: 'bg-red-100 text-red-600'         },
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
    <div className="bg-white rounded-2xl border border-neutral-100 p-5">
      <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center text-neutral-600 mb-3">
        <Icon size={18} />
      </div>
      <p className="text-sm text-neutral-500">{label}</p>
      {loading ? (
        <div className="mt-1 h-7 w-24 animate-pulse rounded-lg bg-neutral-100" />
      ) : (
        <p className="text-2xl font-bold font-heading text-neutral-900">{value}</p>
      )}
    </div>
  );
}

// ---------- Skeleton rows ----------

function RecentOrdersSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-neutral-100 last:border-0">
          {Array.from({ length: 4 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded-lg bg-neutral-100" />
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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading text-neutral-900">Дашборд</h1>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
          Обновить
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 mb-6">
          {error}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden mt-6">
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <p className="font-heading text-sm font-bold text-neutral-900">Последние заказы</p>
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
              <tr className="bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Дата
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Сумма
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
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
                    className="px-4 py-10 text-center text-sm text-neutral-400"
                  >
                    Заказов пока нет
                  </td>
                </tr>
              ) : (
                stats.recentOrders.map((order) => {
                  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.created;
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs font-medium text-neutral-500">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-xs text-neutral-700">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-heading text-sm font-bold text-neutral-900">
                        {formatPrice(order.totalPrice)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusCfg.color)}>
                          {statusCfg.label}
                        </span>
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
