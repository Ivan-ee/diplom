'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, RefreshCw, Trash2, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { fetchClient } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';

// ---------- Types ----------

interface PromoCode {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscountAmount: number | null;
  startsAt: string | null;
  expiresAt: string | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usageCount: number;
  isActive: boolean;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------- Helpers ----------

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function formatDiscountValue(promo: PromoCode): string {
  if (promo.discountType === 'percentage') {
    return `${promo.discountValue}%`;
  }
  return formatPrice(promo.discountValue);
}

// ---------- Add PromoCode Modal ----------

interface AddPromoCodeModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function AddPromoCodeModal({ onClose, onCreated }: AddPromoCodeModalProps) {
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [usageLimitPerUser, setUsageLimitPerUser] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.error('Введите код промокода');
      return;
    }
    const parsedValue = parseFloat(discountValue);
    if (isNaN(parsedValue) || parsedValue <= 0) {
      toast.error('Введите корректное значение скидки');
      return;
    }
    if (discountType === 'percentage' && parsedValue > 100) {
      toast.error('Процент скидки не может быть больше 100');
      return;
    }

    const body: Record<string, unknown> = {
      code: code.trim().toUpperCase(),
      discountType,
      discountValue:
        discountType === 'percentage' ? parsedValue : Math.round(parsedValue * 100),
    };

    if (minOrderAmount) {
      body.minOrderAmount = Math.round(parseFloat(minOrderAmount) * 100);
    }
    if (maxDiscountAmount && discountType === 'percentage') {
      body.maxDiscountAmount = Math.round(parseFloat(maxDiscountAmount) * 100);
    }
    if (startsAt) body.startsAt = new Date(startsAt).toISOString();
    if (expiresAt) body.expiresAt = new Date(expiresAt).toISOString();
    if (usageLimit) body.usageLimit = parseInt(usageLimit, 10);
    if (usageLimitPerUser) body.usageLimitPerUser = parseInt(usageLimitPerUser, 10);
    if (description.trim()) body.description = description.trim();

    setSaving(true);
    try {
      await fetchClient('/promo-codes', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      toast.success('Промокод успешно создан');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось создать промокод');
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    'w-full rounded-xl border border-[var(--color-champagne)] bg-white px-4 py-3 text-sm text-[var(--color-graphite)] focus:border-[var(--color-caramel)] focus:outline-none focus:ring-1 focus:ring-[var(--color-caramel)]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-neutral-900">Создать промокод</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            aria-label="Закрыть"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Code */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-500" htmlFor="pc-code">
              Код промокода
            </label>
            <input
              id="pc-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Например: SUMMER20"
              className={cn(fieldClass, 'font-mono uppercase')}
              required
            />
          </div>

          {/* Discount type */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-500" htmlFor="pc-type">
              Тип скидки
            </label>
            <select
              id="pc-type"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
              className={fieldClass}
            >
              <option value="percentage">Процент (%)</option>
              <option value="fixed">Фиксированная сумма (₽)</option>
            </select>
          </div>

          {/* Discount value */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-500" htmlFor="pc-value">
              Значение скидки{discountType === 'percentage' ? ' (%)' : ' (руб.)'}
            </label>
            <input
              id="pc-value"
              type="number"
              min="1"
              max={discountType === 'percentage' ? 100 : undefined}
              step={discountType === 'percentage' ? '1' : '0.01'}
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === 'percentage' ? 'Например: 20' : 'Например: 500'}
              className={fieldClass}
              required
            />
          </div>

          {/* Min order amount */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-500" htmlFor="pc-min-order">
              Минимальная сумма заказа (руб.) — необязательно
            </label>
            <input
              id="pc-min-order"
              type="number"
              min="0"
              step="0.01"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              placeholder="Например: 1000"
              className={fieldClass}
            />
          </div>

          {/* Max discount amount (only for percentage) */}
          {discountType === 'percentage' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-500" htmlFor="pc-max-discount">
                Максимальная скидка (руб.) — необязательно
              </label>
              <input
                id="pc-max-discount"
                type="number"
                min="0"
                step="0.01"
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
                placeholder="Например: 2000"
                className={fieldClass}
              />
            </div>
          )}

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-500" htmlFor="pc-starts">
                Дата начала
              </label>
              <input
                id="pc-starts"
                type="date"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-500" htmlFor="pc-expires">
                Дата окончания
              </label>
              <input
                id="pc-expires"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>

          {/* Usage limits */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-500" htmlFor="pc-limit">
                Общий лимит
              </label>
              <input
                id="pc-limit"
                type="number"
                min="1"
                step="1"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="Без лимита"
                className={fieldClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-neutral-500" htmlFor="pc-limit-user">
                Лимит на пользователя
              </label>
              <input
                id="pc-limit-user"
                type="number"
                min="1"
                step="1"
                value={usageLimitPerUser}
                onChange={(e) => setUsageLimitPerUser(e.target.value)}
                placeholder="Без лимита"
                className={fieldClass}
              />
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-500" htmlFor="pc-desc">
              Описание — необязательно
            </label>
            <textarea
              id="pc-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Внутренняя заметка об этом промокоде"
              rows={2}
              className={cn(fieldClass, 'resize-none')}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[var(--color-caramel)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-caramel-hover)] transition-colors disabled:opacity-50"
            >
              {saving && <RefreshCw size={13} className="animate-spin" />}
              {saving ? 'Сохранение...' : 'Создать'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Active toggle ----------

interface ActiveToggleProps {
  promoId: string;
  isActive: boolean;
  onToggle: (id: string, value: boolean) => void;
}

function ActiveToggle({ promoId, isActive, onToggle }: ActiveToggleProps) {
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    setLoading(true);
    try {
      await fetchClient(`/promo-codes/${promoId}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !isActive }),
      });
      onToggle(promoId, !isActive);
    } catch {
      toast.error('Не удалось изменить статус промокода');
      onToggle(promoId, isActive);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isActive}
      onClick={handleChange}
      disabled={loading}
      className={cn(
        'relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-1 disabled:opacity-50',
        isActive ? 'bg-[var(--color-caramel)]' : 'bg-[var(--color-champagne)]'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
          isActive ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  );
}

// ---------- Deactivate button ----------

interface DeactivateButtonProps {
  promoId: string;
  onDeactivated: (id: string) => void;
}

function DeactivateButton({ promoId, onDeactivated }: DeactivateButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDeactivate = async () => {
    setDeleting(true);
    try {
      await fetchClient(`/promo-codes/${promoId}`, { method: 'DELETE' });
      onDeactivated(promoId);
      toast.success('Промокод деактивирован');
    } catch {
      toast.error('Не удалось деактивировать промокод');
      setConfirming(false);
    } finally {
      setDeleting(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => void handleDeactivate()}
          disabled={deleting}
          title="Подтвердить деактивацию"
          className="flex h-6 w-6 items-center justify-center rounded text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? <RefreshCw size={11} className="animate-spin" /> : <Check size={13} />}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100"
          title="Отмена"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title="Деактивировать промокод"
      className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-300 hover:text-red-400 hover:bg-red-50 transition-colors"
    >
      <Trash2 size={14} />
    </button>
  );
}

// ---------- Skeleton ----------

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-b border-neutral-100 last:border-0">
          {Array.from({ length: 8 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div
                className={cn(
                  'animate-pulse rounded-lg bg-neutral-100 h-4',
                  j === 0 ? 'w-24' : j === 7 ? 'w-8' : 'w-16'
                )}
              />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ---------- Page ----------

export default function AdminPromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    fetchClient<PromoCode[]>('/promo-codes?page=1&limit=100')
      .then((res) => setPromoCodes(res.data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Ошибка загрузки промокодов')
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggleActive = (id: string, value: boolean) => {
    setPromoCodes((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isActive: value } : p))
    );
  };

  const handleDeactivated = (id: string) => {
    setPromoCodes((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading text-neutral-900">Промокоды</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
            Обновить
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[var(--color-caramel)] text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-caramel-hover)] transition-colors"
          >
            <Plus size={14} />
            Создать промокод
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Код
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Тип
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Значение
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Мин. сумма
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Использований
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Период
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
              ) : promoCodes.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-neutral-400"
                  >
                    Промокодов нет
                  </td>
                </tr>
              ) : (
                promoCodes.map((promo) => {
                  const hasPeriod = promo.startsAt || promo.expiresAt;

                  return (
                    <tr
                      key={promo.id}
                      className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
                    >
                      {/* Code */}
                      <td className="px-4 py-3">
                        <span className="font-mono font-bold text-neutral-900 tracking-wide">
                          {promo.code}
                        </span>
                        {promo.description && (
                          <p className="mt-0.5 max-w-[160px] truncate text-xs text-neutral-400">
                            {promo.description}
                          </p>
                        )}
                      </td>

                      {/* Type badge */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold',
                            promo.discountType === 'percentage'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-emerald-50 text-emerald-600'
                          )}
                        >
                          {promo.discountType === 'percentage' ? '%' : '₽'}
                        </span>
                      </td>

                      {/* Discount value */}
                      <td className="px-4 py-3">
                        <span className="font-heading text-sm font-bold text-neutral-900">
                          {formatDiscountValue(promo)}
                        </span>
                        {promo.discountType === 'percentage' && promo.maxDiscountAmount && (
                          <p className="text-xs text-neutral-400">
                            макс. {formatPrice(promo.maxDiscountAmount)}
                          </p>
                        )}
                      </td>

                      {/* Min order amount */}
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {promo.minOrderAmount != null
                          ? formatPrice(promo.minOrderAmount)
                          : <span className="text-neutral-400">—</span>}
                      </td>

                      {/* Usage count */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-neutral-700">
                          {promo.usageCount}
                          <span className="text-neutral-400">
                            {' / '}
                            {promo.usageLimit ?? '∞'}
                          </span>
                        </span>
                        {promo.usageLimitPerUser && (
                          <p className="text-xs text-neutral-400">
                            {promo.usageLimitPerUser} на польз.
                          </p>
                        )}
                      </td>

                      {/* Period */}
                      <td className="px-4 py-3 text-sm text-neutral-600">
                        {hasPeriod ? (
                          <div className="flex flex-col gap-0.5">
                            {promo.startsAt && (
                              <span className="text-xs text-neutral-500">
                                с {formatDate(promo.startsAt)}
                              </span>
                            )}
                            {promo.expiresAt && (
                              <span className="text-xs text-neutral-500">
                                по {formatDate(promo.expiresAt)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-neutral-400">Бессрочный</span>
                        )}
                      </td>

                      {/* Active toggle */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ActiveToggle
                            promoId={promo.id}
                            isActive={promo.isActive}
                            onToggle={handleToggleActive}
                          />
                          <span className="text-xs text-neutral-500">
                            {promo.isActive ? 'Активен' : 'Отключён'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <DeactivateButton
                          promoId={promo.id}
                          onDeactivated={handleDeactivated}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <AddPromoCodeModal
          onClose={() => setShowAddModal(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
