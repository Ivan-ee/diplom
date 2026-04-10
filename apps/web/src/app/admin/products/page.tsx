'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { Plus, RefreshCw, Pencil, Check, X, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { fetchClient } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
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
    'w-full rounded-xl border border-[var(--color-champagne)] bg-white px-4 py-3 text-sm text-[var(--color-graphite)] focus:border-[var(--color-caramel)] focus:outline-none focus:ring-1 focus:ring-[var(--color-caramel)]';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-heading text-lg font-bold text-neutral-900">Добавить товар</h2>
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
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-500" htmlFor="ap-name">
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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-500" htmlFor="ap-desc">
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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-500" htmlFor="ap-price">
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

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-500" htmlFor="ap-category">
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
              className="h-4 w-4 rounded border-neutral-200 accent-[var(--color-caramel)]"
            />
            <label htmlFor="ap-available" className="text-sm text-neutral-700">
              Доступен для заказа
            </label>
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
        'relative w-10 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-1 disabled:opacity-50',
        available ? 'bg-[var(--color-caramel)]' : 'bg-[var(--color-champagne)]'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
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
        body: JSON.stringify({ pricePerKg: newPriceKopecks }),
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
        className="group flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 transition-colors hover:bg-neutral-100"
      >
        <span className="font-heading text-sm font-bold text-neutral-900">
          {formatPrice(price)}
        </span>
        <Pencil
          size={11}
          className="text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100"
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
        className="border border-[var(--color-champagne)] rounded-lg px-2 py-1 w-24 text-sm text-[var(--color-graphite)] focus:outline-none focus:border-[var(--color-caramel)]"
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
        className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100"
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ---------- Delete button ----------

interface DeleteButtonProps {
  productId: string;
  onDeleted: (id: string) => void;
}

function DeleteButton({ productId, onDeleted }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetchClient(`/admin/products/${productId}`, { method: 'DELETE' });
      onDeleted(productId);
      toast.success('Товар удалён');
    } catch {
      toast.error('Не удалось удалить товар');
      setConfirming(false);
    } finally {
      setDeleting(false);
    }
  };

  if (confirming) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => void handleDelete()}
          disabled={deleting}
          title="Подтвердить удаление"
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
      title="Удалить товар"
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
          {Array.from({ length: 6 }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div
                className={cn(
                  'animate-pulse rounded-lg bg-neutral-100',
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

  const handleProductDeleted = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading text-neutral-900">Товары</h1>
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
            Добавить товар
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
          <table className="w-full min-w-[700px] border-collapse text-sm">
            <thead>
              <tr className="bg-neutral-50">
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Фото
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Название
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Цена
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Категория
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                  Доступность
                </th>
                <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
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
                    className="px-4 py-12 text-center text-sm text-neutral-400"
                  >
                    Товаров нет
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const imageUrl = product.imageUrl ?? product.images?.[0];
                  const categoryRaw = product.type ?? product.category;
                  const category = typeof categoryRaw === 'string' ? categoryRaw : categoryRaw?.slug ?? '';
                  const categoryLabel = CATEGORY_LABELS[category] ?? category;

                  return (
                    <tr
                      key={product.id}
                      className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
                    >
                      {/* Photo */}
                      <td className="px-4 py-3">
                        <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-neutral-100">
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
                        <p className="max-w-[200px] truncate text-sm font-medium text-neutral-900">
                          {product.name}
                        </p>
                        {product.weightMin != null && (
                          <p className="text-xs text-neutral-500">
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
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                            {categoryLabel}
                          </span>
                        ) : (
                          <span className="text-xs text-neutral-400">—</span>
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
                          <span className="text-xs text-neutral-500">
                            {product.isAvailable !== false ? 'Доступен' : 'Скрыт'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <DeleteButton productId={product.id} onDeleted={handleProductDeleted} />
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
