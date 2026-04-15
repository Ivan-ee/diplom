'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, Cake, RefreshCw, Pencil, X, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { fetchClient } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import type { Order, OrderStatus, OrderItem, OrderItemConstructor } from '@/components/account/OrderCard';

// ---------- Extended types ----------

interface AdminOrder extends Omit<Order, 'customerName' | 'customerPhone'> {
  user?: { id: string; name: string; email: string; phone: string | null };
  promoCode?: string | null;
  discountAmount?: number | null;
  originalPrice?: number | null;
}

interface AdminOrderItem {
  id: string;
  type: 'product' | 'constructor';
  productId?: string;
  productName?: string;
  productImageUrl?: string;
  name?: string;
  weight: number;
  quantity: number;
  price: number;
  cakeConfig?: OrderItemConstructor['cakeConfig'];
  inscription?: string;
  screenshotUrl?: string;
}

interface AdminProduct {
  id: string;
  name: string;
}

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

function ExpandedOrderRow({ order }: { order: AdminOrder }) {
  const items = order.items as unknown as AdminOrderItem[];
  return (
    <tr>
      <td colSpan={6} className="bg-neutral-50 px-4 py-3">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Состав заказа
          </p>
          <div className="space-y-2">
            {items.map((item: AdminOrderItem, idx: number) => (
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
                        <Cake size={13} className="text-[var(--color-caramel)]" />
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
                      <p className="text-sm font-medium text-neutral-900">{item.productName ?? item.name ?? 'Товар'}</p>
                      <p className="text-xs text-neutral-500">
                        {`${parseFloat(String(item.weight)).toLocaleString('ru-RU')} кг`}
                        {item.quantity > 1 ? ` × ${item.quantity}` : ''}
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
          {/* Promo code info */}
          {order.promoCode && (
            <div className="rounded-xl border border-neutral-100 bg-white p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1">Промокод</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-50 text-emerald-700">
                  {order.promoCode}
                </span>
              </div>
              <div className="text-right">
                {order.originalPrice != null && (
                  <p className="text-xs text-neutral-400 line-through">{formatPrice(order.originalPrice)}</p>
                )}
                {order.discountAmount != null && order.discountAmount > 0 && (
                  <p className="text-sm font-medium text-emerald-600">−{formatPrice(order.discountAmount)}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ---------- Time slots ----------

const TIME_SLOTS = [
  { value: 'morning', label: 'Утро (9:00–12:00)' },
  { value: 'day',     label: 'День (12:00–17:00)' },
  { value: 'evening', label: 'Вечер (17:00–20:00)' },
];

// ---------- Field class ----------

const fieldClass =
  'w-full rounded-xl border border-[var(--color-champagne)] bg-white px-4 py-3 text-sm text-[var(--color-graphite)] focus:border-[var(--color-caramel)] focus:outline-none focus:ring-1 focus:ring-[var(--color-caramel)]';

// ---------- Edit order modal ----------

interface EditOrderModalProps {
  order: AdminOrder;
  onClose: () => void;
  onSaved: (updated: Partial<AdminOrder> & { id: string }) => void;
  onReload: () => void;
}

function EditOrderModal({ order, onClose, onSaved, onReload }: EditOrderModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'items'>('info');

  // Info tab state
  const [pickupDate, setPickupDate] = useState(order.pickupDate?.split('T')[0] ?? '');
  const [pickupTimeSlot, setPickupTimeSlot] = useState(order.pickupTimeSlot ?? 'morning');
  const [phone, setPhone] = useState((order as AdminOrder & { phone?: string }).phone ?? '');
  const [comment, setComment] = useState(order.comment ?? '');
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [saving, setSaving] = useState(false);

  // Items tab state
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addProductId, setAddProductId] = useState('');
  const [addWeight, setAddWeight] = useState('');
  const [addQuantity, setAddQuantity] = useState('1');
  const [addingItem, setAddingItem] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'items' && products.length === 0) {
      setProductsLoading(true);
      fetchClient<AdminProduct[]>('/admin/products')
        .then((res) => {
          setProducts(res.data);
          if (res.data.length > 0) setAddProductId(res.data[0].id);
        })
        .catch(() => toast.error('Не удалось загрузить список товаров'))
        .finally(() => setProductsLoading(false));
    }
  }, [activeTab, products.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetchClient(`/admin/orders/${order.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          pickupDate: pickupDate || undefined,
          pickupTimeSlot,
          phone: phone.trim() || undefined,
          comment: comment.trim() || undefined,
        }),
      });
      if (status !== order.status) {
        await fetchClient(`/admin/orders/${order.id}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status }),
        });
      }
      toast.success('Заказ обновлён');
      onSaved({ id: order.id, pickupDate, pickupTimeSlot, comment, status });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось обновить заказ');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setDeletingItemId(itemId);
    try {
      await fetchClient(`/admin/orders/${order.id}/items/${itemId}`, { method: 'DELETE' });
      toast.success('Позиция удалена');
      onReload();
    } catch {
      toast.error('Не удалось удалить позицию');
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addProductId || !addWeight) return;
    setAddingItem(true);
    try {
      await fetchClient(`/admin/orders/${order.id}/items`, {
        method: 'POST',
        body: JSON.stringify({
          productId: addProductId,
          weight: parseFloat(addWeight),
          quantity: parseInt(addQuantity, 10) || 1,
        }),
      });
      toast.success('Товар добавлен');
      setShowAddForm(false);
      setAddWeight('');
      setAddQuantity('1');
      onReload();
    } catch {
      toast.error('Не удалось добавить товар');
    } finally {
      setAddingItem(false);
    }
  };

  const items = order.items as AdminOrderItem[];
  const statusCfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.created;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold font-heading text-neutral-900">
            Заказ №{order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-neutral-100 mb-5">
          <button
            onClick={() => setActiveTab('info')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'info'
                ? 'border-[var(--color-caramel)] text-[var(--color-caramel)]'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            )}
          >
            Информация
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={cn(
              'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'items'
                ? 'border-[var(--color-caramel)] text-[var(--color-caramel)]'
                : 'border-transparent text-neutral-400 hover:text-neutral-600'
            )}
          >
            Товары ({order.items?.length ?? 0})
          </button>
        </div>

        {/* Tab: Info */}
        {activeTab === 'info' && (
          <div>
            {/* Readonly block */}
            <div className="rounded-xl border border-neutral-100 bg-neutral-50 p-4 mb-5 space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Номер заказа</span>
                <span className="font-mono text-xs font-medium text-neutral-700">
                  #{order.orderNumber ?? order.id.slice(0, 8).toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Клиент</span>
                <span className="font-medium text-neutral-900">
                  {order.user?.name ?? '—'}
                </span>
              </div>
              {order.user?.email && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Email</span>
                  <span className="text-neutral-700">{order.user.email}</span>
                </div>
              )}
              {order.user?.phone && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Телефон клиента</span>
                  <span className="text-neutral-700">{order.user.phone}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Дата создания</span>
                <span className="text-neutral-700">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Сумма заказа</span>
                <span className="font-bold font-heading text-neutral-900">{formatPrice(order.totalPrice)}</span>
              </div>
              {order.promoCode && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Промокод</span>
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {order.promoCode}
                    </span>
                  </div>
                  {order.originalPrice != null && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Цена до скидки</span>
                      <span className="text-neutral-400 line-through">{formatPrice(order.originalPrice)}</span>
                    </div>
                  )}
                  {order.discountAmount != null && order.discountAmount > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-neutral-500">Скидка</span>
                      <span className="font-medium text-emerald-600">−{formatPrice(order.discountAmount)}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Status */}
            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-medium text-neutral-600">Статус</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className={fieldClass}
              >
                {ALL_STATUSES.map(([value, cfg]) => (
                  <option key={value} value={value}>{cfg.label}</option>
                ))}
              </select>
            </div>

            {/* Editable fields */}
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-600">
                  Дата самовывоза
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-600">
                  Время
                </label>
                <select
                  value={pickupTimeSlot}
                  onChange={(e) => setPickupTimeSlot(e.target.value)}
                  className={fieldClass}
                >
                  {TIME_SLOTS.map((slot) => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-600">
                  Телефон для связи
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (999) 000-00-00"
                  className={fieldClass}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-neutral-600">
                  Комментарий
                </label>
                <textarea
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className={fieldClass}
                  placeholder="Дополнительные пожелания..."
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-caramel)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving && <RefreshCw size={13} className="animate-spin" />}
                  Сохранить изменения
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab: Items */}
        {activeTab === 'items' && (
          <div className="space-y-3">
            {items.length === 0 ? (
              <p className="text-center text-sm text-neutral-400 py-6">Нет позиций</p>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 bg-white"
                >
                  {/* Image or emoji */}
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                    {item.productImageUrl ? (
                      <Image
                        src={item.productImageUrl}
                        alt={item.productName ?? ''}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    ) : item.type === 'constructor' ? (
                      <span className="flex h-full w-full items-center justify-center text-lg">🎂</span>
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-lg">📦</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 truncate">
                      {item.type === 'constructor'
                        ? 'Собранный торт'
                        : (item.productName ?? item.name ?? 'Товар')}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {parseFloat(String(item.weight)).toLocaleString('ru-RU')} кг
                      {item.quantity > 1 ? ` × ${item.quantity}` : ''}
                    </p>
                  </div>

                  {/* Price */}
                  <span className="shrink-0 text-sm font-bold text-neutral-900">
                    {formatPrice(item.price)}
                  </span>

                  {/* Delete button */}
                  <button
                    onClick={() => void handleDeleteItem(item.id)}
                    disabled={deletingItemId === item.id}
                    className="shrink-0 text-neutral-300 hover:text-red-400 transition-colors disabled:opacity-50"
                    title="Удалить позицию"
                  >
                    {deletingItemId === item.id ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <X size={14} />
                    )}
                  </button>
                </div>
              ))
            )}

            {/* Add item */}
            {showAddForm ? (
              <form
                onSubmit={(e) => void handleAddItem(e)}
                className="rounded-xl border border-[var(--color-champagne)] bg-neutral-50 p-4 space-y-3"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                  Добавить товар
                </p>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-neutral-600">
                    Товар
                  </label>
                  {productsLoading ? (
                    <div className="h-10 animate-pulse rounded-xl bg-neutral-100" />
                  ) : (
                    <select
                      value={addProductId}
                      onChange={(e) => setAddProductId(e.target.value)}
                      className={fieldClass}
                      required
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-neutral-600">
                      Вес (кг)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={addWeight}
                      onChange={(e) => setAddWeight(e.target.value)}
                      placeholder="1.5"
                      className={fieldClass}
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-neutral-600">
                      Количество
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={addQuantity}
                      onChange={(e) => setAddQuantity(e.target.value)}
                      className={fieldClass}
                      required
                    />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-2 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    disabled={addingItem}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--color-caramel)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {addingItem && <RefreshCw size={13} className="animate-spin" />}
                    Добавить
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowAddForm(true)}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--color-champagne)] py-3 text-sm font-medium text-neutral-400 hover:border-[var(--color-caramel)] hover:text-[var(--color-caramel)] transition-colors"
              >
                <Plus size={14} />
                Добавить товар
              </button>
            )}
          </div>
        )}
      </div>
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
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<number>(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editOrder, setEditOrder] = useState<AdminOrder | null>(null);

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    fetchClient<AdminOrder[]>('/admin/orders')
      .then((res) => setOrders(res.data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Ошибка загрузки заказов')
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const handleStatusUpdated = (id: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
  };

  const handleOrderSaved = (updated: Partial<AdminOrder> & { id: string }) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
    );
  };

  const handleReload = useCallback(() => {
    load();
  }, [load]);

  const filterGroup = FILTER_GROUPS[activeFilter];
  const filtered = filterGroup.statuses
    ? orders.filter((o) => filterGroup.statuses!.includes(o.status))
    : orders;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading text-neutral-900">Заказы</h1>
        {loading && (
          <RefreshCw size={16} className="animate-spin text-neutral-400" />
        )}
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
                ? 'bg-[var(--color-caramel)] text-white'
                : 'bg-white border border-[var(--color-champagne)] text-neutral-600 hover:border-neutral-300'
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
                          {order.user?.name ? (
                            <div>
                              <p className="text-sm font-medium text-neutral-900">
                                {order.user.name}
                              </p>
                              {order.user.phone && (
                                <p className="text-xs text-neutral-500">
                                  {order.user.phone}
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
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditOrder(order)}
                              title="Редактировать"
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-300 hover:text-[var(--color-caramel)] hover:bg-neutral-100 transition-colors"
                            >
                              <Pencil size={14} />
                            </button>
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

      {editOrder && (
        <EditOrderModal
          order={editOrder}
          onClose={() => setEditOrder(null)}
          onSaved={handleOrderSaved}
          onReload={() => {
            handleReload();
            setEditOrder(null);
          }}
        />
      )}
    </div>
  );
}
