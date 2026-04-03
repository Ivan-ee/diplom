'use client';

import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Check } from 'lucide-react';
import { fetchClient } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type IngredientType = 'bases' | 'fillings' | 'coatings' | 'decorations';

interface Ingredient {
  id: string;
  name: string;
  pricePerKg?: number;
  pricePerUnit?: number;
  type?: string;
  category?: string;
  isAvailable: boolean;
}

interface IngredientsData {
  bases: Ingredient[];
  fillings: Ingredient[];
  coatings: Ingredient[];
  decorations: Ingredient[];
}

const TABS: { key: IngredientType; label: string; priceField: 'pricePerKg' | 'pricePerUnit'; priceLabel: string }[] = [
  { key: 'bases', label: 'Основы', priceField: 'pricePerKg', priceLabel: '₽/кг' },
  { key: 'fillings', label: 'Начинки', priceField: 'pricePerKg', priceLabel: '₽/кг' },
  { key: 'coatings', label: 'Покрытия', priceField: 'pricePerKg', priceLabel: '₽/кг' },
  { key: 'decorations', label: 'Декор', priceField: 'pricePerUnit', priceLabel: '₽/шт' },
];

function InlinePrice({
  value,
  ingredientId,
  type,
  field,
  onSaved,
}: {
  value: number;
  ingredientId: string;
  type: IngredientType;
  field: 'pricePerKg' | 'pricePerUnit';
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(value / 100));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const newPrice = Math.round(parseFloat(price) * 100);
    if (isNaN(newPrice) || newPrice <= 0) return;
    setSaving(true);
    try {
      await fetchClient(`/admin/constructor/ingredients/${ingredientId}`, {
        method: 'PUT',
        body: JSON.stringify({ type, [field]: newPrice }),
      });
      onSaved();
      setEditing(false);
    } catch {
      // revert
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-sm font-medium text-dark hover:text-dusty-rose transition-colors cursor-pointer"
      >
        {formatPrice(value)}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && save()}
        className="w-24 h-8 rounded-md border border-gray-300 px-2 text-sm focus:border-dusty-rose focus:outline-none focus:ring-1 focus:ring-dusty-rose/50"
        autoFocus
      />
      <button
        onClick={save}
        disabled={saving}
        className="h-8 w-8 rounded-md bg-dusty-rose text-white flex items-center justify-center hover:bg-dusty-rose-hover disabled:opacity-50"
      >
        {saving ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
      </button>
      <button
        onClick={() => { setEditing(false); setPrice(String(value / 100)); }}
        className="h-8 px-2 text-xs text-text-secondary hover:text-dark"
      >
        Отмена
      </button>
    </div>
  );
}

export default function AdminConstructorPage() {
  const [data, setData] = useState<IngredientsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<IngredientType>('bases');

  const load = useCallback(() => {
    setLoading(true);
    fetchClient<IngredientsData>('/constructor/ingredients')
      .then((res) => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleAvailability = async (id: string, type: IngredientType, current: boolean) => {
    try {
      await fetchClient(`/admin/constructor/ingredients/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ type, isAvailable: !current }),
      });
      load();
    } catch {}
  };

  const tab = TABS.find((t) => t.key === activeTab)!;
  const items = data?.[activeTab] ?? [];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-xl font-bold text-dark">Настройки конструктора</h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            Управление ингредиентами и ценами
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
          Обновить
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-semibold transition-colors',
              activeTab === t.key
                ? 'bg-dusty-rose text-white'
                : 'bg-white text-dark border border-soft-peach hover:border-dusty-rose hover:text-dusty-rose',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-soft-peach/60 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[500px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-soft-peach/60 bg-cream/60">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Название
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Цена ({tab.priceLabel})
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Доступность
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className={i % 2 === 1 ? 'bg-cream/30' : ''}>
                    <td className="px-4 py-3"><div className="h-4 w-32 animate-pulse rounded bg-cream" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-20 animate-pulse rounded bg-cream" /></td>
                    <td className="px-4 py-3"><div className="h-4 w-16 animate-pulse rounded bg-cream" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-12 text-center text-text-secondary">
                    Нет данных
                  </td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr
                    key={item.id}
                    className={cn(
                      'border-b border-soft-peach/40 transition-colors hover:bg-dusty-rose/5',
                      idx % 2 === 1 && 'bg-cream/20',
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-dark">{item.name}</span>
                        {item.category && (
                          <Badge variant="outline" className="text-xs">{item.category}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <InlinePrice
                        value={item[tab.priceField] ?? 0}
                        ingredientId={item.id}
                        type={activeTab}
                        field={tab.priceField}
                        onSaved={load}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleAvailability(item.id, activeTab, item.isAvailable)}
                        className={cn(
                          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                          item.isAvailable ? 'bg-success' : 'bg-gray-300',
                        )}
                      >
                        <span
                          className={cn(
                            'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                            item.isAvailable ? 'translate-x-6' : 'translate-x-1',
                          )}
                        />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
