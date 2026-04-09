'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Plus, RefreshCw, Pencil, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { fetchClient } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Product } from '@/components/catalog/ProductCard';

// ---------- Category labels ----------

const CATEGORY_LABELS: Record<string, string> = {
  cake:     'Торт',
  cupcake:  'Капкейк',
  macaron:  'Макарон',
  pastry:   'Выпечка',
};

const CATEGORY_OPTIONS = [
  { value: 'cake',    label: 'Торт' },
  { value: 'cupcake', label: 'Капкейк' },
  { value: 'macaron', label: 'Макарон' },
  { value: 'pastry',  label: 'Выпечка' },
];

// ---------- Add Product Modal ----------

interface AddProductModalProps {
  onClose: () => void;
  onCreated: () => void;
}

function AddProductModal({ onClose, onCreated }: AddProductModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [categoryId, setCategoryId] = useState('cake');
  const [isAvailable, setIsAvailable] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(pricePerKg);
    if (!name.trim()) { toast.error('Введите название товара'); return; }
    if (isNaN(parsed) || parsed <= 0) { toast.error('Введите корректную цену'); return; }

    setSaving(true);
    try {
      await fetchClient('/admin/products', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          pricePerKg: Math.round(parsed * 100),
          categoryId,
          isAvailable,
        }),
      });
      toast.success('Товар успешно создан');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Не удалось создать товар');
    } finally {
      setSaving(false);
    }
  };

  const fieldClass =
    'w-full rounded-lg border border-[var(--color-soft-peach)] bg-white px-3 py-2 text-sm text-[var(--color-dark)] focus:border-[var(--color-dusty-rose)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dusty-rose)]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-[var(--color-dark)]">Добавить товар</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-cream)] hover:text-[var(--color-dark)]"
            aria-label="Закрыть"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)]" htmlFor="ap-name">
              Название
            </label>
            <input
              id="ap-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Медовик классический"
              className={fieldClass}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)]" htmlFor="ap-desc">
              Описание
            </label>
            <textarea
              id="ap-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Краткое описание товара"
              rows={3}
              className={cn(fieldClass, 'resize-none')}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)]" htmlFor="ap-price">
              Цена за кг (руб.)
            </label>
            <input
              id="ap-price"
              type="number"
              min="1"
              step="0.01"
              value={pricePerKg}
              onChange={(e) => setPricePerKg(e.target.value)}
              placeholder="Например: 1500"
              className={fieldClass}
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)]" htmlFor="ap-category">
              Категория
            </label>
            <select
              id="ap-category"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={fieldClass}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="ap-available"
              type="checkbox"
              checked={isAvailable}
              onChange={(e) => setIsAvailable(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--color-soft-peach)] accent-[var(--color-dusty-rose)]"
            />
            <label htmlFor="ap-available" className="text-sm text-[var(--color-dark)]">
              Доступен для заказа
            </label>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" size="sm" className="flex-1" onClick={onClose} disabled={saving}>
              Отмена
            </Button>
            <Button type="submit" size="sm" className="flex-1" disabled={saving}>
              {saving ? <RefreshCw size={13} className="animate-spin" /> : null}
              {saving ? 'Сохранение...' : 'Создать'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Availability toggle ----------

interface AvailabilityToggleProps {
  productId: string;
  available: boolean;
  onToggle: (id: string, value: boolean) => void;
}

function AvailabilityToggle({ productId, available, onToggle }: AvailabilityToggleProps) {
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    setLoading(true);
    try {
      await fetchClient(`/admin/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ isAvailable: !available }),
      });
      onToggle(productId, !available);
    } catch {
      toast.error('Не удалось изменить доступность');
      onToggle(productId, available);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={available}
      onClick={handleChange}
      disabled={loading}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-dusty-rose)] focus-visible:ring-offset-1 disabled:opacity-50',
        available ? 'bg-[var(--color-dusty-rose)]' : 'bg-gray-200'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
          available ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  );
}

// ---------- Inline price editor ----------

interface PriceEditorProps {
  productId: string;
  price: number;
  onSaved: (id: string, price: number) => void;
}

function PriceEditor({ productId, price, onSaved }: PriceEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(Math.round(price / 100)));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setValue(String(Math.round(price / 100)));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const cancel = () => {
    setValue(String(Math.round(price / 100)));
    setEditing(false);
  };

  const save = async () => {
    const parsed = parseInt(value, 10);
    if (isNaN(parsed) || parsed <= 0) { cancel(); return; }
    const newPriceKopecks = parsed * 100;
    if (newPriceKopecks === price) { setEditing(false); return; }
    setSaving(true);
    try {
      await fetchClient(`/admin/products/${productId}`, {
        method: 'PUT',
        body: JSON.stringify({ priceMin: newPriceKopecks }),
      });
      onSaved(productId, newPriceKopecks);
      setEditing(false);
    } catch {
      toast.error('Не удалось сохранить цену');
      cancel();
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button
        onClick={startEdit}
        className="group flex items-center gap-1.5 rounded px-1.5 py-0.5 transition-colors hover:bg-[var(--color-cream)]"
      >
        <span className="font-heading text-sm font-bold text-[var(--color-dusty-rose)]">
          {formatPrice(price)}
        </span>
        <Pencil
          size={11}
          className="text-[var(--color-text-secondary)] opacity-0 transition-opacity group-hover:opacity-100"
        />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        type="number"
        min="1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void save();
          if (e.key === 'Escape') cancel();
        }}
        className="w-24 rounded-md border border-[var(--color-dusty-rose)] bg-white px-2 py-1 text-sm font-medium text-[var(--color-dark)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dusty-rose)]"
        disabled={saving}
      />
      <button
        onClick={() => void save()}
        disabled={saving}
        className="flex h-6 w-6 items-center justify-center rounded text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
      >
        {saving ? <RefreshCw size={11} className="animate-spin" /> : <Check size={13} />}
      </button>
      <button
        onClick={cancel}
        className="flex h-6 w-6 items-center justify-center rounded text-[var(--color-text-secondary)] hover:bg-[var(--color-cream)]"
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ---------- Skeleton ----------

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className={i % 2 === 1 ? 'bg-[var(--color-cream)]/20' : ''}>
          {Array.from({ length: 6 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div
                className={cn(
                  'animate-pulse rounded bg-[var(--color-cream)]',
                  j === 0 ? 'h-10 w-10' : 'h-4'
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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const load = useCallback(() => {
    setError(null);
    setLoading(true);
    fetchClient<Product[]>('/admin/products')
      .then((res) => setProducts(res.data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Ошибка загрузки товаров')
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleAvailability = (id: string, value: boolean) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, isAvailable: value } : p))
    );
  };

  const handlePriceSaved = (id: string, price: number) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, priceMin: price } : p))
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-[var(--color-dark)]">Товары</h1>
          <p className="mt-0.5 text-sm text-[var(--color-text-secondary)]">
            {loading ? 'Загрузка...' : `${products.length} товаров`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
            Обновить
          </Button>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <Plus size={14} />
            Добавить товар
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--color-soft-peach)]/60 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-[var(--color-soft-peach)]/60 bg-[var(--color-cream)]/60">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  Фото
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  Название
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  Цена
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  Категория
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  Доступность
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton />
              ) : products.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-[var(--color-text-secondary)]"
                  >
                    Товаров нет
                  </td>
                </tr>
              ) : (
                products.map((product, idx) => {
                  const imageUrl = product.imageUrl ?? product.images?.[0];
                  const categoryRaw = product.type ?? product.category;
                  const category = typeof categoryRaw === 'string' ? categoryRaw : categoryRaw?.slug ?? '';
                  const categoryLabel = CATEGORY_LABELS[category] ?? category;

                  return (
                    <tr
                      key={product.id}
                      className={cn(
                        'border-b border-[var(--color-soft-peach)]/40 transition-colors duration-100 hover:bg-[var(--color-dusty-rose)]/5',
                        idx % 2 === 1 && 'bg-[var(--color-cream)]/20'
                      )}
                    >
                      {/* Photo */}
                      <td className="px-4 py-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-lg bg-[var(--color-cream)]">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-lg">
                              🎂
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Name */}
                      <td className="px-4 py-3">
                        <p className="max-w-[200px] truncate text-sm font-medium text-[var(--color-dark)]">
                          {product.name}
                        </p>
                        {product.weightMin != null && (
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            от {product.weightMin / 1000} кг
                          </p>
                        )}
                      </td>

                      {/* Price — inline editable */}
                      <td className="px-4 py-3">
                        <PriceEditor
                          productId={product.id}
                          price={product.priceMin ?? 0}
                          onSaved={handlePriceSaved}
                        />
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        {categoryLabel ? (
                          <Badge variant="secondary" className="text-xs">
                            {categoryLabel}
                          </Badge>
                        ) : (
                          <span className="text-xs text-[var(--color-text-secondary)]">—</span>
                        )}
                      </td>

                      {/* Availability toggle */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <AvailabilityToggle
                            productId={product.id}
                            available={product.isAvailable !== false}
                            onToggle={handleToggleAvailability}
                          />
                          <span className="text-xs text-[var(--color-text-secondary)]">
                            {product.isAvailable !== false ? 'Доступен' : 'Скрыт'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <Button variant="ghost" size="icon-sm">
                          <Pencil size={13} />
                        </Button>
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
        <AddProductModal
          onClose={() => setShowAddModal(false)}
          onCreated={load}
        />
      )}
    </div>
  );
}
