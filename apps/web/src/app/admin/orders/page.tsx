'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Cake, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { fetchClient } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import type { Order, OrderStatus, OrderItem, OrderItemConstructor } from '@/components/account/OrderCard';

// ---------- Status config ----------

const STATUS_CONFIG: Record<
  OrderStatus,
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
    <tr>
      <td colSpan={6} className="bg-neutral-50 px-4 py-3">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Состав заказа
          </p>
          <div className="space-y-2">
            {order.items.map((item: OrderItem, idx: number) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-xl border border-neutral-100 bg-white p-3"
              >
                <span
                  className={cn(
                    'mt-0.5 shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
                    item.type === 'constructor'
                      ? 'bg-neutral-100 text-neutral-700'
                      : 'bg-neutral-100 text-neutral-500'
                  )}
                >
                  {item.type === 'constructor' ? 'Конструктор' : 'Товар'}
                </span>
                <div className="min-w-0 flex-1">
                  {item.type === 'constructor' ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <Cake size={13} className="text-[var(--color-dusty-rose)]" />
                        <span className="text-sm font-medium text-neutral-900">
                          Собранный торт
                        </span>
                      </div>
                      {(item as OrderItemConstructor).cakeConfig && (
                        <ul className="mt-1.5 space-y-0.5 text-xs text-neutral-500">
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
                              {` (${parseFloat(String(l.weight)).toLocaleString('ru-RU')} кг)`}
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
                      <p className="text-sm font-medium text-neutral-900">{item.name}</p>
                      <p className="text-xs text-neutral-500">
                        {`${parseFloat(String(item.weight)).toLocaleString('ru-RU')} кг`}
                        {'quantity' in item && item.quantity > 1 ? ` × ${item.quantity}` : ''}
                      </p>
                    </>
                  )}
                </div>
                <span className="shrink-0 text-sm font-semibold text-neutral-900">
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
      toast.error('Не удалось обновить статус');
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
        className="border border-neutral-200 rounded-lg px-2 py-1 text-sm bg-white text-neutral-700 focus:border-[var(--color-dusty-rose)] focus:outline-none"
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
          'text-sm font-medium transition-colors',
          saved
            ? 'text-emerald-600'
            : selected === order.status
            ? 'text-neutral-300 cursor-default'
            : 'text-[var(--color-dusty-rose)] hover:underline disabled:opacity-50'
        )}
      >
        {saving ? (
          <RefreshCw size={13} className="animate-spin" />
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
        <tr key={i} className="border-b border-neutral-100 last:border-0">
          {Array.from({ length: 6 }).map((_, j) => (
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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading text-neutral-900">Заказы</h1>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
          Обновить
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {FILTER_GROUPS.map((group, idx) => (
          <button
            key={idx}
            onClick={() => setActiveFilter(idx)}
            className={cn(
              'px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap',
              activeFilter === idx
                ? 'bg-[var(--color-dusty-rose)] text-white'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:border-neutral-300'
            )}
          >
            {group.label}
            {!loading && (
              <span className={cn('ml-1.5', activeFilter === idx ? 'text-white/70' : 'text-neutral-400')}>
                {group.statuses
                  ? orders.filter((o) => group.statuses!.includes(o.status)).length
                  : orders.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Дата
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Клиент
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Сумма
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Статус
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
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
                    className="px-4 py-12 text-center text-sm text-neutral-400"
                  >
                    Заказов нет
                  </td>
                </tr>
              ) : (
                filtered.map((order) => {
                  const isExpanded = expandedId === order.id;
                  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.created;
                  const displayNumber =
                    order.orderNumber ?? order.id.slice(0, 8).toUpperCase();

                  return (
                    <React.Fragment key={order.id}>
                      <tr className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-xs font-medium text-neutral-500">
                          {displayNumber}
                        </td>
                        <td className="px-4 py-3 text-xs text-neutral-700">
                          {formatDate(order.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          {order.customerName ? (
                            <div>
                              <p className="text-sm font-medium text-neutral-900">
                                {order.customerName}
                              </p>
                              {order.customerPhone && (
                                <p className="text-xs text-neutral-500">
                                  {order.customerPhone}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-heading text-sm font-bold text-neutral-900">
                          {formatPrice(order.totalPrice)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusCfg.color)}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <StatusCell order={order} onUpdated={handleStatusUpdated} />
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : order.id)}
                              className="flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-neutral-700 transition-colors"
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
                    </React.Fragment>
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
