'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { RefreshCw, Check, X, Plus, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { fetchClient } from '@/lib/api';
import { formatPrice, cn } from '@/lib/utils';
import { uploadModelToMinio } from '@/lib/upload';
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
  type: IngredientApiType;
  onToggle: (id: string, value: boolean) => void;
}

function AvailabilityToggle({ id, available, type, onToggle }: AvailabilityToggleProps) {
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    setLoading(true);
    try {
      await fetchClient(`/admin/constructor/ingredients/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ type, isAvailable: !available }),
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
  type: IngredientApiType;
  onSaved: (id: string, price: number) => void;
}

function PriceEditor({ id, price, priceKey, type, onSaved }: PriceEditorProps) {
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
        body: JSON.stringify({ type, [priceKey]: newPriceKopecks }),
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

interface TextEditorProps {
  id: string;
  type: IngredientApiType;
  field: 'visualKey';
  value: string;
  onSaved: (id: string, value: string) => void;
}

function TextEditor({ id, type, field, value, onSaved }: TextEditorProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = () => {
    setDraft(value);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const save = async () => {
    const normalized = draft.trim();
    if (!normalized) {
      setEditing(false);
      setDraft(value);
      return;
    }
    if (normalized === value) {
      setEditing(false);
      return;
    }

    setSaving(true);
    try {
      await fetchClient(`/admin/constructor/ingredients/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ type, [field]: normalized }),
      });
      onSaved(id, normalized);
      setEditing(false);
    } catch {
      setDraft(value);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <button
        onClick={startEdit}
        className="rounded-lg bg-neutral-100 px-2 py-1 font-mono text-xs text-neutral-600 hover:bg-neutral-200"
      >
        {value || '—'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void save();
          if (e.key === 'Escape') setEditing(false);
        }}
        disabled={saving}
        className="w-32 rounded-lg border border-[var(--color-champagne)] px-2 py-1 font-mono text-xs focus:border-[var(--color-caramel)] focus:outline-none"
      />
      <button
        onClick={() => void save()}
        disabled={saving}
        className="flex h-6 w-6 items-center justify-center rounded text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
        aria-label="Сохранить visual key"
      >
        {saving ? <RefreshCw size={11} className="animate-spin" /> : <Check size={13} />}
      </button>
    </div>
  );
}

const DECOR_CATEGORIES = ['berries', 'chocolate', 'toppers', 'flowers', 'figures', 'candle'] as const;

function CategorySelect({
  id,
  value,
  onSaved,
}: {
  id: string;
  value: string;
  onSaved: (id: string, value: string) => void;
}) {
  const [saving, setSaving] = useState(false);

  const handleChange = async (next: string) => {
    setSaving(true);
    try {
      await fetchClient(`/admin/constructor/ingredients/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ type: 'decoration', category: next }),
      });
      onSaved(id, next);
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      value={value}
      disabled={saving}
      onChange={(event) => void handleChange(event.target.value)}
      className="rounded-lg border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-600"
    >
      {DECOR_CATEGORIES.map((category) => (
        <option key={category} value={category}>
          {category}
        </option>
      ))}
    </select>
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

// ---------- Delete ingredient button ----------

type IngredientApiType = 'base' | 'filling' | 'coating' | 'decoration';

interface DeleteIngredientButtonProps {
  ingredientId: string;
  type: IngredientApiType;
  onDeleted: (id: string) => void;
}

function DeleteIngredientButton({ ingredientId, type, onDeleted }: DeleteIngredientButtonProps) {
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await fetchClient(`/admin/constructor/ingredients/${ingredientId}`, {
        method: 'DELETE',
        body: JSON.stringify({ type }),
      });
      toast.success('Ингредиент удалён');
      onDeleted(ingredientId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка удаления');
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  };

  if (confirm) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => void handleDelete()}
          disabled={loading}
          className="flex h-6 w-6 items-center justify-center rounded text-red-600 hover:bg-red-50 disabled:opacity-50"
          aria-label="Подтвердить удаление"
        >
          {loading ? <RefreshCw size={11} className="animate-spin" /> : <Check size={13} />}
        </button>
        <button
          onClick={() => setConfirm(false)}
          disabled={loading}
          className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 disabled:opacity-50"
          aria-label="Отмена"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-red-50 hover:text-red-500 transition-colors"
      aria-label="Удалить ингредиент"
    >
      <Trash2 size={14} />
    </button>
  );
}

// ---------- Model file input ----------

interface ModelFileInputProps {
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}

function ModelFileInput({ file, onChange, disabled }: ModelFileInputProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    if (!selected.name.endsWith('.glb')) {
      toast.error('Выберите файл .glb');
      return;
    }
    onChange(selected);
  };

  const handleRemove = () => onChange(null);

  if (file) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-[var(--color-champagne)] bg-white px-4 py-3">
        <span className="flex-1 truncate text-sm text-[var(--color-graphite)]">
          {file.name} <span className="text-neutral-400">({(file.size / 1024).toFixed(0)} КБ)</span>
        </span>
        <button
          type="button"
          onClick={handleRemove}
          disabled={disabled}
          className="flex h-6 w-6 items-center justify-center rounded text-neutral-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
          aria-label="Удалить файл"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-champagne)] bg-white px-4 py-3 text-sm text-neutral-400 hover:border-[var(--color-caramel)] hover:text-[var(--color-caramel)] transition-colors',
        disabled && 'pointer-events-none opacity-50'
      )}
    >
      <Upload size={16} />
      <span>Выберите .glb файл</span>
      <input
        type="file"
        accept=".glb"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
      />
    </label>
  );
}

// ---------- Add ingredient modal ----------

const TYPE_LABELS: Record<IngredientApiType, string> = {
  base: 'основу',
  filling: 'начинку',
  coating: 'покрытие',
  decoration: 'декор',
};

const fieldClass =
  'w-full rounded-xl border border-[var(--color-champagne)] bg-white px-4 py-3 text-sm text-[var(--color-graphite)] focus:border-[var(--color-caramel)] focus:outline-none focus:ring-1 focus:ring-[var(--color-caramel)]';

interface AddIngredientModalProps {
  type: IngredientApiType;
  onClose: () => void;
  onCreated: () => void;
}

function AddIngredientModal({ type, onClose, onCreated }: AddIngredientModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pricePerKg, setPricePerKg] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [visualKey, setVisualKey] = useState(type === 'base' ? 'default' : 'cream');
  const [category, setCategory] = useState<(typeof DECOR_CATEGORIES)[number]>('berries');
  const [sortOrder, setSortOrder] = useState('0');
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const hasDescription = type === 'base' || type === 'filling';
  const hasPerKg = type === 'base' || type === 'filling' || type === 'coating';
  const hasPerUnit = type === 'decoration';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Укажите название');
      return;
    }

    setSaving(true);
    try {
      let modelUrl: string | undefined;

      if (modelFile) {
        const result = await uploadModelToMinio(modelFile);
        modelUrl = result.fileUrl;
      }

      const body: Record<string, unknown> = {
        type,
        name: name.trim(),
        visualKey: visualKey.trim() || (type === 'base' ? 'default' : 'cream'),
        sortOrder: parseInt(sortOrder, 10) || 0,
      };

      if (modelUrl) body.modelUrl = modelUrl;
      if (hasDescription && description.trim()) {
        body.description = description.trim();
      }
      if (hasPerKg) {
        const parsed = parseFloat(pricePerKg);
        if (isNaN(parsed) || parsed <= 0) {
          toast.error('Укажите корректную цену за кг');
          setSaving(false);
          return;
        }
        body.pricePerKg = Math.round(parsed * 100);
      }
      if (hasPerUnit) {
        const parsed = parseFloat(pricePerUnit);
        if (isNaN(parsed) || parsed <= 0) {
          toast.error('Укажите корректную цену за штуку');
          setSaving(false);
          return;
        }
        body.pricePerUnit = Math.round(parsed * 100);
        body.category = category;
      }

      await fetchClient('/admin/constructor/ingredients', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      toast.success('Ингредиент создан');
      onCreated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка создания');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold font-heading text-neutral-900">
            Добавить {TYPE_LABELS[type]}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors"
            aria-label="Закрыть"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
              Название <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите название"
              className={fieldClass}
              disabled={saving}
              autoFocus
            />
          </div>

          {/* Description */}
          {hasDescription && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
                Описание
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Необязательное описание"
                rows={3}
                className={cn(fieldClass, 'resize-none')}
                disabled={saving}
              />
            </div>
          )}

          {/* Price per kg */}
          {hasPerKg && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
                Цена за кг (₽) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(e.target.value)}
                placeholder="500"
                className={fieldClass}
                disabled={saving}
              />
            </div>
          )}

          {/* Price per unit */}
          {hasPerUnit && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
                Цена за штуку (₽) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                placeholder="150"
                className={fieldClass}
                disabled={saving}
              />
            </div>
          )}

          {/* Visual key */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
              Visual key <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={visualKey}
              onChange={(e) => setVisualKey(e.target.value)}
              placeholder="cream"
              className={fieldClass}
              disabled={saving}
            />
          </div>

          {/* 3D Model upload */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
              3D модель (.glb)
            </label>
            <ModelFileInput
              file={modelFile}
              onChange={setModelFile}
              disabled={saving}
            />
          </div>

          {type === 'decoration' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
                Категория декора
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as (typeof DECOR_CATEGORIES)[number])}
                className={fieldClass}
                disabled={saving}
              >
                {DECOR_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort order */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
              Порядок сортировки
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder="0"
              className={fieldClass}
              disabled={saving}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[var(--color-caramel)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-caramel-hover)] transition-colors disabled:opacity-50"
            >
              {saving && <RefreshCw size={13} className="animate-spin" />}
              Создать
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Edit ingredient modal ----------

interface EditIngredientModalProps {
  ingredient: AnyIngredient;
  type: IngredientApiType;
  onClose: () => void;
  onUpdated: () => void;
}

function EditIngredientModal({ ingredient, type, onClose, onUpdated }: EditIngredientModalProps) {
  const [name, setName] = useState(ingredient.name);
  const [description, setDescription] = useState(
    'description' in ingredient && typeof ingredient.description === 'string' ? ingredient.description : ''
  );
  const [pricePerKg, setPricePerKg] = useState(
    'pricePerKg' in ingredient ? String(Math.round((ingredient as { pricePerKg: number }).pricePerKg / 100)) : ''
  );
  const [pricePerUnit, setPricePerUnit] = useState(
    'pricePerUnit' in ingredient ? String(Math.round((ingredient as { pricePerUnit: number }).pricePerUnit / 100)) : ''
  );
  const [visualKey, setVisualKey] = useState(
    'visualKey' in ingredient ? ingredient.visualKey : 'cream'
  );
  const [category, setCategory] = useState<(typeof DECOR_CATEGORIES)[number]>(
    'category' in ingredient ? (ingredient as IngredientDecoration).category as (typeof DECOR_CATEGORIES)[number] : 'berries'
  );
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const hasDescription = type === 'base' || type === 'filling';
  const hasPerKg = type === 'base' || type === 'filling' || type === 'coating';
  const hasPerUnit = type === 'decoration';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Укажите название');
      return;
    }

    setSaving(true);
    try {
      let modelUrl: string | undefined;

      if (modelFile) {
        const result = await uploadModelToMinio(modelFile);
        modelUrl = result.fileUrl;
      }

      const body: Record<string, unknown> = {
        type,
        name: name.trim(),
        visualKey: visualKey.trim() || (type === 'base' ? 'default' : 'cream'),
      };

      if (modelUrl) body.modelUrl = modelUrl;
      if (hasDescription) body.description = description.trim();
      if (hasPerKg) {
        const parsed = parseFloat(pricePerKg);
        if (isNaN(parsed) || parsed <= 0) {
          toast.error('Укажите корректную цену за кг');
          setSaving(false);
          return;
        }
        body.pricePerKg = Math.round(parsed * 100);
      }
      if (hasPerUnit) {
        const parsed = parseFloat(pricePerUnit);
        if (isNaN(parsed) || parsed <= 0) {
          toast.error('Укажите корректную цену за штуку');
          setSaving(false);
          return;
        }
        body.pricePerUnit = Math.round(parsed * 100);
        body.category = category;
      }

      await fetchClient(`/admin/constructor/ingredients/${ingredient.id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      });
      toast.success('Ингредиент обновлён');
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка обновления');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold font-heading text-neutral-900">
            Редактировать {TYPE_LABELS[type]}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 transition-colors"
            aria-label="Закрыть"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
              Название <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={fieldClass}
              disabled={saving}
              autoFocus
            />
          </div>

          {hasDescription && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
                Описание
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={cn(fieldClass, 'resize-none')}
                disabled={saving}
              />
            </div>
          )}

          {hasPerKg && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
                Цена за кг (₽) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={pricePerKg}
                onChange={(e) => setPricePerKg(e.target.value)}
                className={fieldClass}
                disabled={saving}
              />
            </div>
          )}

          {hasPerUnit && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
                Цена за штуку (₽) <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                className={fieldClass}
                disabled={saving}
              />
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
              Visual key <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={visualKey}
              onChange={(e) => setVisualKey(e.target.value)}
              className={fieldClass}
              disabled={saving}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
              3D модель (.glb)
            </label>
            <ModelFileInput
              file={modelFile}
              onChange={setModelFile}
              disabled={saving}
            />
            {'modelUrl' in ingredient && (ingredient as IngredientDecoration).modelUrl && (
              <p className="text-xs text-neutral-400 truncate">
                Текущая: {(ingredient as unknown as { modelUrl: string }).modelUrl}
              </p>
            )}
          </div>

          {type === 'decoration' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-neutral-600 uppercase tracking-wide">
                Категория декора
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as (typeof DECOR_CATEGORIES)[number])}
                className={fieldClass}
                disabled={saving}
              >
                {DECOR_CATEGORIES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[var(--color-caramel)] px-4 py-2.5 text-sm font-medium text-white hover:bg-[var(--color-caramel-hover)] transition-colors disabled:opacity-50"
            >
              {saving && <RefreshCw size={13} className="animate-spin" />}
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------- Generic ingredient table ----------

interface IngredientTableProps<T extends AnyIngredient> {
  rows: T[];
  loading: boolean;
  priceKey: 'pricePerKg' | 'pricePerUnit';
  priceLabel: string;
  type: IngredientApiType;
  extraColumns?: {
    header: string;
    render: (row: T) => React.ReactNode;
  }[];
  onAvailabilityToggle: (id: string, value: boolean) => void;
  onPriceSaved: (id: string, price: number) => void;
  onPatchSaved: (id: string, patch: Partial<AnyIngredient>) => void;
  onDeleted: (id: string) => void;
  onEdit: (row: T) => void;
}

function IngredientTable<T extends AnyIngredient>({
  rows,
  loading,
  priceKey,
  priceLabel,
  type,
  extraColumns = [],
  onAvailabilityToggle,
  onPriceSaved,
  onPatchSaved,
  onDeleted,
  onEdit,
}: IngredientTableProps<T>) {
  // +1 for actions column
  const colCount = 5 + extraColumns.length;

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
                Visual key
              </th>
              <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                {priceLabel}
              </th>
              <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                Доступно
              </th>
              <th className="px-4 py-3 text-left text-xs text-neutral-500 uppercase tracking-wider font-medium">
                Действия
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
                  <td className="px-4 py-3 text-sm text-neutral-700">
                    <TextEditor
                      id={row.id}
                      type={type}
                      field="visualKey"
                      value={'visualKey' in row ? row.visualKey : ''}
                      onSaved={(rowId, value) => onPatchSaved(rowId, { visualKey: value } as Partial<AnyIngredient>)}
                    />
                  </td>

                  {/* Price — inline editable */}
                  <td className="px-4 py-3">
                    <PriceEditor
                      id={row.id}
                      price={priceKey === 'pricePerKg' ? (row as { pricePerKg: number }).pricePerKg : (row as { pricePerUnit: number }).pricePerUnit}
                      priceKey={priceKey}
                      type={type}
                      onSaved={onPriceSaved}
                    />
                  </td>

                  {/* Availability */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <AvailabilityToggle
                        id={row.id}
                        available={row.available}
                        type={type}
                        onToggle={onAvailabilityToggle}
                      />
                      <span className="text-xs text-neutral-500">
                        {row.available ? 'Да' : 'Нет'}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEdit(row)}
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-blue-50 hover:text-blue-500 transition-colors"
                        aria-label="Редактировать"
                      >
                        <Plus size={14} className="rotate-45" />
                      </button>
                      <DeleteIngredientButton
                        ingredientId={row.id}
                        type={type}
                        onDeleted={onDeleted}
                      />
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

// Map Tab key → IngredientApiType
const TAB_TO_API_TYPE: Record<Tab, IngredientApiType> = {
  bases:       'base',
  fillings:    'filling',
  coatings:    'coating',
  decorations: 'decoration',
};

// Map Tab key → section key in ConstructorCatalog
type IngredientSection = keyof Pick<ConstructorCatalog, 'bases' | 'fillings' | 'coatings' | 'decorations'>;

export default function AdminConstructorPage() {
  const [activeTab, setActiveTab] = useState<Tab>('bases');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<AnyIngredient | null>(null);
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

  useEffect(() => {
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

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

  const handlePatch = (section: IngredientSection) => (id: string, patch: Partial<AnyIngredient>) =>
    updateIngredient(section, id, patch);

  const handleDeleted = (section: IngredientSection) => (id: string) => {
    setConstructorCatalog((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [section]: (prev[section] as AnyIngredient[]).filter((item) => item.id !== id),
      };
    });
  };

  const sectionCount = (section: IngredientSection) =>
    ingredients?.[section].length ?? 0;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading text-neutral-900">Ингредиенты</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-[var(--color-caramel)] text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-caramel-hover)] transition-colors"
          >
            <Plus size={14} />
            Добавить
          </button>
        </div>
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
          type="base"
          onAvailabilityToggle={handleAvailability('bases')}
          onPriceSaved={handlePrice('bases', 'pricePerKg')}
          onPatchSaved={handlePatch('bases')}
          onDeleted={handleDeleted('bases')}
          onEdit={(row) => setEditingIngredient(row)}
        />
      )}

      {activeTab === 'fillings' && (
        <IngredientTable<IngredientFilling>
          rows={(ingredients?.fillings ?? []) as IngredientFilling[]}
          loading={loading}
          priceKey="pricePerKg"
          priceLabel="Цена за кг"
          type="filling"
          onAvailabilityToggle={handleAvailability('fillings')}
          onPriceSaved={handlePrice('fillings', 'pricePerKg')}
          onPatchSaved={handlePatch('fillings')}
          onDeleted={handleDeleted('fillings')}
          onEdit={(row) => setEditingIngredient(row)}
        />
      )}

      {activeTab === 'coatings' && (
        <IngredientTable<IngredientCoating>
          rows={(ingredients?.coatings ?? []) as IngredientCoating[]}
          loading={loading}
          priceKey="pricePerKg"
          priceLabel="Цена за кг"
          type="coating"
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
          onPatchSaved={handlePatch('coatings')}
          onDeleted={handleDeleted('coatings')}
          onEdit={(row) => setEditingIngredient(row)}
        />
      )}

      {activeTab === 'decorations' && (
        <IngredientTable<IngredientDecoration>
          rows={(ingredients?.decorations ?? []) as IngredientDecoration[]}
          loading={loading}
          priceKey="pricePerUnit"
          priceLabel="Цена за штуку"
          type="decoration"
          extraColumns={[
            {
              header: 'Категория',
              render: (row) => (
                <CategorySelect
                  id={row.id}
                  value={row.category}
                  onSaved={(id, category) => updateIngredient('decorations', id, { category } as Partial<AnyIngredient>)}
                />
              ),
            },
          ]}
          onAvailabilityToggle={handleAvailability('decorations')}
          onPriceSaved={handlePrice('decorations', 'pricePerUnit')}
          onPatchSaved={handlePatch('decorations')}
          onDeleted={handleDeleted('decorations')}
          onEdit={(row) => setEditingIngredient(row)}
        />
      )}

      {/* Add ingredient modal */}
      {showAddModal && (
        <AddIngredientModal
          type={TAB_TO_API_TYPE[activeTab]}
          onClose={() => setShowAddModal(false)}
          onCreated={load}
        />
      )}

      {/* Edit ingredient modal */}
      {editingIngredient && (
        <EditIngredientModal
          ingredient={editingIngredient}
          type={TAB_TO_API_TYPE[activeTab]}
          onClose={() => setEditingIngredient(null)}
          onUpdated={load}
        />
      )}
    </div>
  );
}
