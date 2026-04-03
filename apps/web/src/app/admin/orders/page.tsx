'use client';

import { useEffect, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Cake, RefreshCw } from 'lucide-react';
import { fetchClient } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Order, OrderStatus, OrderItem, OrderItemConstructor } from '@/components/account/OrderCard';

// ---------- Status config ----------

const STATUS_CONFIG: Record<
  OrderStatus,
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

const ALL_STATUSES = Object.entries(STATUS_CONFIG) as [OrderStatus, (typeof STATUS_CONFIG)[OrderStatus]][];

const FILTER_GROUPS: { label: string; statuses: OrderStatus[] | null }[] = [
  { label: 'Все',       statuses: null },
  { label: 'Новые',     statuses: ['created'] },
  { label: 'В работе',  statuses: ['accepted', 'preparing'] },
  { label: 'Готовые',   statuses: ['ready', 'picked_up'] },
  { label: 'Закрытые',  statuses: ['completed', 'cancelled'] },
];

const SHAPE_LABELS: Record<string, string> = {
  circle: 'Круглый',
  square: 'Квадратный',
  heart:  'Сердце',
};

// ---------- Helpers ----------

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}.${mm}.${yyyy} ${hh}:${min}`;
}

// ---------- Expanded row ----------

function ExpandedOrderRow({ order }: { order: Order }) {
  return (
    <tr className="bg-[var(--color-cream)]/60">
      <td colSpan={6} className="px-4 py-4">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
            Состав заказа
          </p>
          <div className="space-y-2">
            {order.items.map((item: OrderItem, idx: number) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg border border-[var(--color-soft-peach)]/60 bg-white p-3"
              >
                <Badge
                  variant={item.type === 'constructor' ? 'default' : 'secondary'}
                  className="mt-0.5 shrink-0 text-xs"
                >
                  {item.type === 'constructor' ? 'Конструктор' : 'Товар'}
                </Badge>
                <div className="min-w-0 flex-1">
                  {item.type === 'constructor' ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <Cake size={13} className="text-[var(--color-dusty-rose)]" />
                        <span className="text-sm font-medium text-[var(--color-dark)]">
                          Собранный торт
                        </span>
                      </div>
                      {(item as OrderItemConstructor).cakeConfig && (
                        <ul className="mt-1.5 space-y-0.5 text-xs text-[var(--color-text-secondary)]">
                          {(item as OrderItemConstructor).cakeConfig?.shape && (
                            <li>
                              Форма:{' '}
                              {SHAPE_LABELS[(item as OrderItemConstructor).cakeConfig!.shape!] ??
                                (item as OrderItemConstructor).cakeConfig!.shape}
                            </li>
                          )}
                          {((item as OrderItemConstructor).cakeConfig?.tierCount ?? 1) > 1 && (
                            <li>Ярусов: {(item as OrderItemConstructor).cakeConfig!.tierCount}</li>
                          )}
                          {(item as OrderItemConstructor).cakeConfig?.layers?.map((l, i) => (
                            <li key={i}>
                              Ярус {i + 1}: {l.baseName ?? '—'}
                              {l.fillingName ? ` / ${l.fillingName}` : ''}
                              {` (${l.weight >= 1000 ? `${l.weight / 1000} кг` : `${l.weight} г`})`}
                            </li>
                          ))}
                          {(item as OrderItemConstructor).cakeConfig?.coatingName && (
                            <li>Покрытие: {(item as OrderItemConstructor).cakeConfig!.coatingName}</li>
                          )}
                          {(item as OrderItemConstructor).cakeConfig?.inscription && (
                            <li>
                              Надпись: «{(item as OrderItemConstructor).cakeConfig!.inscription}»
                            </li>
                          )}
                          {(item as OrderItemConstructor).cakeConfig?.decorations?.length ? (
                            <li>
                              Декор:{' '}
                              {(item as OrderItemConstructor).cakeConfig!.decorations!.join(', ')}
                            </li>
                          ) : null}
                        </ul>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-[var(--color-dark)]">{item.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {item.weight >= 1000 ? `${item.weight / 1000} кг` : `${item.weight} г`}
                        {'quantity' in item && item.quantity > 1 ? ` × ${item.quantity}` : ''}
                      </p>
                    </>
                  )}
                </div>
                <span className="shrink-0 text-sm font-semibold text-[var(--color-dusty-rose)]">
                  {formatPrice(item.price)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </td>
    </tr>
  );
}

// ---------- Status updater cell ----------

interface StatusCellProps {
  order: Order;
  onUpdated: (id: string, status: OrderStatus) => void;
}

function StatusCell({ order, onUpdated }: StatusCellProps) {
  const [selected, setSelected] = useState<OrderStatus>(order.status);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleUpdate = async () => {
    if (selected === order.status) return;
    setSaving(true);
    try {
      await fetchClient(`/admin/orders/${order.id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: selected }),
      });
      onUpdated(order.id, selected);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      alert('Не удалось обновить статус');
      setSelected(order.status);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={selected}
        onChange={(e) => setSelected(e.target.value as OrderStatus)}
        className="rounded-md border border-[var(--color-soft-peach)] bg-white px-2 py-1.5 text-xs font-medium text-[var(--color-dark)] focus:border-[var(--color-dusty-rose)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dusty-rose)]"
      >
        {ALL_STATUSES.map(([value, cfg]) => (
          <option key={value} value={value}>
            {cfg.label}
          </option>
        ))}
      </select>
      <button
        onClick={handleUpdate}
        disabled={saving || selected === order.status}
        className={cn(
          'rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors duration-150',
          saved
            ? 'bg-emerald-100 text-emerald-700'
            : selected === order.status
            ? 'cursor-default bg-[var(--color-cream)] text-[var(--color-text-secondary)]'
            : 'bg-[var(--color-dusty-rose)] text-white hover:bg-[var(--color-dusty-rose-hover)] disabled:opacity-50'
        )}
      >
        {saving ? (
          <RefreshCw size={11} className="animate-spin" />
        ) : saved ? (
          'Сохранено'
        ) : (
          'Обновить'
        )}
      </button>
    </div>
  );
}

// ---------- Skeleton ----------

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className={i % 2 === 1 ? 'bg-[var(--color-cream)]/30' : ''}>
          {Array.from({ length: 6 }).map((_, j) => (
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<number>(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    fetchClient<Order[]>('/admin/orders')
      .then((res) => setOrders(res.data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Ошибка загрузки заказов')
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleStatusUpdated = (id: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
  };

  const filterGroup = FILTER_GROUPS[activeFilter];
  const filtered = filterGroup.statuses
    ? orders.filter((o) => filterGroup.statuses!.includes(o.status))
    : orders;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-[var(--color-dark)]">Заказы</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
            {loading ? 'Загрузка...' : `${orders.length} заказов всего`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
          Обновить
        </Button>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTER_GROUPS.map((group, idx) => (
          <button
            key={idx}
            onClick={() => setActiveFilter(idx)}
            className={cn(
              'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors duration-150',
              activeFilter === idx
                ? 'bg-[var(--color-dusty-rose)] text-white'
                : 'bg-white text-[var(--color-dark)] border border-[var(--color-soft-peach)] hover:border-[var(--color-dusty-rose)] hover:text-[var(--color-dusty-rose)]'
            )}
          >
            {group.label}
            {!loading && (
              <span className="ml-1.5 opacity-70">
                {group.statuses
                  ? orders.filter((o) => group.statuses!.includes(o.status)).length
                  : orders.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-soft-peach)]/60 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--color-soft-peach)]/60 bg-[var(--color-cream)]/60">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  Дата
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  Клиент
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  Сумма
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  Статус
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton />
              ) : filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-[var(--color-text-secondary)]"
                  >
                    Заказов нет
                  </td>
                </tr>
              ) : (
                filtered.map((order, idx) => {
                  const isExpanded = expandedId === order.id;
                  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.created;
                  const displayNumber =
                    order.orderNumber ?? order.id.slice(0, 8).toUpperCase();

                  return (
                    <>
                      <tr
                        key={order.id}
                        className={cn(
                          'border-b border-[var(--color-soft-peach)]/40 transition-colors duration-100',
                          idx % 2 === 1 && 'bg-[var(--color-cream)]/20',
                          'hover:bg-[var(--color-dusty-rose)]/5'
                        )}
                      >
                        <td className="px-4 py-3 font-mono text-xs font-medium text-[var(--color-text-secondary)]">
                          {displayNumber}
                        </td>
                        <td className="px-4 py-3 text-xs text-[var(--color-dark)]">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          {order.customerName ? (
                            <div>
                              <p className="text-sm font-medium text-[var(--color-dark)]">
                                {order.customerName}
                              </p>
                              {order.customerPhone && (
                                <p className="text-xs text-[var(--color-text-secondary)]">
                                  {order.customerPhone}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-[var(--color-text-secondary)]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-heading text-sm font-bold text-[var(--color-dusty-rose)]">
                          {formatPrice(order.totalPrice)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={statusCfg.badgeVariant}>
                            {statusCfg.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <StatusCell order={order} onUpdated={handleStatusUpdated} />
                            <button
                              onClick={() =>
                                setExpandedId(isExpanded ? null : order.id)
                              }
                              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-cream)] hover:text-[var(--color-dark)]"
                              aria-expanded={isExpanded}
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp size={13} /> Свернуть
                                </>
                              ) : (
                                <>
                                  <ChevronDown size={13} /> Детали
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <ExpandedOrderRow key={`${order.id}-expanded`} order={order} />
                      )}
                    </>
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
