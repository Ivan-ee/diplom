'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { RefreshCw, Check, X } from 'lucide-react';
import { fetchClient } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import type {
  IngredientBase,
  IngredientFilling,
  IngredientCoating,
  IngredientDecoration,
  ConstructorCatalog,
} from '@/stores/constructor-store';

// ---------- Types ----------

type AnyIngredient =
  | IngredientBase
  | IngredientFilling
  | IngredientCoating
  | IngredientDecoration;

type Tab = 'bases' | 'fillings' | 'coatings' | 'decorations';

const TABS: { key: Tab; label: string }[] = [
  { key: 'bases',       label: 'Основы'   },
  { key: 'fillings',    label: 'Начинки'  },
  { key: 'coatings',    label: 'Покрытия' },
  { key: 'decorations', label: 'Декор'    },
];

// ---------- Availability toggle ----------

interface AvailabilityToggleProps {
  id: string;
  available: boolean;
  onToggle: (id: string, value: boolean) => void;
}

function AvailabilityToggle({ id, available, onToggle }: AvailabilityToggleProps) {
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    setLoading(true);
    try {
      await fetchClient(`/admin/constructor/ingredients/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ available: !available }),
      });
      onToggle(id, !available);
    } catch {
      // no-op — state stays unchanged on error
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
  id: string;
  price: number;
  priceKey: string;
  onSaved: (id: string, price: number) => void;
}

function PriceEditor({ id, price, priceKey, onSaved }: PriceEditorProps) {
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
      await fetchClient(`/admin/constructor/ingredients/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ [priceKey]: newPriceKopecks }),
      });
      onSaved(id, newPriceKopecks);
      setEditing(false);
    } catch {
      cancel();
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button
        onClick={startEdit}
        title="Нажмите для редактирования"
        className="group flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 transition-colors hover:bg-neutral-100"
      >
        <span className="font-heading text-sm font-bold text-[var(--color-graphite)]">
          {formatPrice(price)}
        </span>
        <span className="text-xs text-neutral-400 opacity-0 transition-opacity group-hover:opacity-100">
          ✎
        </span>
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
        aria-label="Сохранить"
      >
        {saving ? <RefreshCw size={11} className="animate-spin" /> : <Check size={13} />}
      </button>
      <button
        onClick={cancel}
        className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100"
        aria-label="Отмена"
      >
        <X size={13} />
      </button>
    </div>
  );
}

// ---------- Skeleton ----------

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-neutral-100 last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="px-4 py-3">
              <div className="h-4 animate-pulse rounded-lg bg-neutral-100" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

// ---------- Generic ingredient table ----------

interface IngredientTableProps<T extends AnyIngredient> {
  rows: T[];
  loading: boolean;
  priceKey: 'pricePerKg' | 'pricePerUnit';
  priceLabel: string;
  extraColumns?: {
    header: string;
    render: (row: T) => React.ReactNode;
  }[];
  onAvailabilityToggle: (id: string, value: boolean) => void;
  onPriceSaved: (id: string, price: number) => void;
}

function IngredientTable<T extends AnyIngredient>({
  rows,
  loading,
  priceKey,
  priceLabel,
  extraColumns = [],
  onAvailabilityToggle,
  onPriceSaved,
}: IngredientTableProps<T>) {
  const colCount = 3 + extraColumns.length;

  return (
    <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px] border-collapse text-sm">
          <thead>
            <tr className="bg-neutral-50">
              <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                Название
              </th>
              {extraColumns.map((col) => (
                <th
                  key={col.header}
                  className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium"
                >
                  {col.header}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                {priceLabel}
              </th>
              <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                Доступно
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <TableSkeleton cols={colCount} />
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={colCount}
                  className="px-4 py-10 text-center text-sm text-neutral-400"
                >
                  Нет данных
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50 transition-colors"
                >
                  {/* Name */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-neutral-900">{row.name}</p>
                    {'description' in row && typeof row.description === 'string' && row.description && (
                      <p className="mt-0.5 max-w-xs truncate text-xs text-neutral-500">
                        {row.description}
                      </p>
                    )}
                  </td>

                  {/* Extra columns */}
                  {extraColumns.map((col) => (
                    <td key={col.header} className="px-4 py-3 text-sm text-neutral-700">
                      {col.render(row)}
                    </td>
                  ))}

                  {/* Price — inline editable */}
                  <td className="px-4 py-3">
                    <PriceEditor
                      id={row.id}
                      price={priceKey === 'pricePerKg' ? (row as { pricePerKg: number }).pricePerKg : (row as { pricePerUnit: number }).pricePerUnit}
                      priceKey={priceKey}
                      onSaved={onPriceSaved}
                    />
                  </td>

                  {/* Availability */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <AvailabilityToggle
                        id={row.id}
                        available={row.available}
                        onToggle={onAvailabilityToggle}
                      />
                      <span className="text-xs text-neutral-500">
                        {row.available ? 'Да' : 'Нет'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ---------- Page ----------

export default function AdminConstructorPage() {
  const [activeTab, setActiveTab] = useState<Tab>('bases');
  const [ingredients, setConstructorCatalog] = useState<ConstructorCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchClient<ConstructorCatalog>('/admin/constructor/ingredients')
      .then((res) => setConstructorCatalog(res.data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Ошибка загрузки ингредиентов')
      )
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  type IngredientSection = keyof Pick<ConstructorCatalog, 'bases' | 'fillings' | 'coatings' | 'decorations'>;

  const updateIngredient = (section: IngredientSection, id: string, patch: Partial<AnyIngredient>) => {
    setConstructorCatalog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [section]: (prev[section] as AnyIngredient[]).map((item) =>
          item.id === id ? { ...item, ...patch } : item
        ),
      };
    });
  };

  const handleAvailability = (section: IngredientSection) => (id: string, value: boolean) =>
    updateIngredient(section, id, { available: value });

  const handlePrice = (section: IngredientSection, priceKey: string) => (id: string, price: number) =>
    updateIngredient(section, id, { [priceKey]: price } as Partial<AnyIngredient>);

  const sectionCount = (section: IngredientSection) =>
    ingredients?.[section].length ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading text-neutral-900">Ингредиенты</h1>
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
        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600 mb-4">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-neutral-100 rounded-xl p-1 gap-1 mb-6">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-lg text-center transition-colors',
              activeTab === key
                ? 'bg-white shadow-sm text-neutral-900'
                : 'text-neutral-500 hover:text-neutral-700'
            )}
          >
            {label}
            {!loading && ingredients && (
              <span className="ml-1.5 text-xs opacity-60">
                {sectionCount(key as IngredientSection)}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {activeTab === 'bases' && (
        <IngredientTable<IngredientBase>
          rows={(ingredients?.bases ?? []) as IngredientBase[]}
          loading={loading}
          priceKey="pricePerKg"
          priceLabel="Цена за кг"
          onAvailabilityToggle={handleAvailability('bases')}
          onPriceSaved={handlePrice('bases', 'pricePerKg')}
        />
      )}

      {activeTab === 'fillings' && (
        <IngredientTable<IngredientFilling>
          rows={(ingredients?.fillings ?? []) as IngredientFilling[]}
          loading={loading}
          priceKey="pricePerKg"
          priceLabel="Цена за кг"
          onAvailabilityToggle={handleAvailability('fillings')}
          onPriceSaved={handlePrice('fillings', 'pricePerKg')}
        />
      )}

      {activeTab === 'coatings' && (
        <IngredientTable<IngredientCoating>
          rows={(ingredients?.coatings ?? []) as IngredientCoating[]}
          loading={loading}
          priceKey="pricePerKg"
          priceLabel="Цена за кг"
          extraColumns={[
            {
              header: 'Тип',
              render: (row) => (
                <span className="text-xs font-medium text-neutral-500">
                  {row.type === 'cream' ? 'Крем' : 'Мастика'}
                </span>
              ),
            },
          ]}
          onAvailabilityToggle={handleAvailability('coatings')}
          onPriceSaved={handlePrice('coatings', 'pricePerKg')}
        />
      )}

      {activeTab === 'decorations' && (
        <IngredientTable<IngredientDecoration>
          rows={(ingredients?.decorations ?? []) as IngredientDecoration[]}
          loading={loading}
          priceKey="pricePerUnit"
          priceLabel="Цена за штуку"
          extraColumns={[
            {
              header: 'Категория',
              render: (row) => (
                <span className="text-xs font-medium text-neutral-500">
                  {row.category}
                </span>
              ),
            },
          ]}
          onAvailabilityToggle={handleAvailability('decorations')}
          onPriceSaved={handlePrice('decorations', 'pricePerUnit')}
        />
      )}
    </div>
  );
}
