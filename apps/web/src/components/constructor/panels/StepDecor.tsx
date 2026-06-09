'use client';

import { useEffect, useId, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { motion } from 'framer-motion';
import { Copy, Grip, Plus, Trash2, X } from 'lucide-react';
import { useConstructorStore, type IngredientDecoration } from '@/stores/constructor-store';
import {
  getDecorationAllowedSurfacesLabel,
  getDecorationReplacementGroup,
  getDecorationUiCategory,
  getDecorationUiCategoryLabel,
  isDecoVisualKeyAvailable,
  type CakeShape,
  type DecorationUiCategory,
} from '@/lib/constructor/model-registry';
import {
  DECORATION_POINTER_DROP_EVENT,
  type DecorationPointerDropDetail,
} from '@/lib/constructor/decoration-drag';
import { cn } from '@/lib/utils';

interface PendingDecorationDrag {
  visualKey: string;
  decorationId: string;
  startX: number;
  startY: number;
  moved: boolean;
  cleanup: () => void;
}

const DECORATION_CATEGORY_ORDER: DecorationUiCategory[] = [
  'berries',
  'chocolate',
  'creamGlaze',
  'meringue',
  'topDecor',
  'candle',
];

export function StepDecor() {
  const inscriptionInputId = useId();
  const pendingDragRef = useRef<PendingDecorationDrag | null>(null);
  const suppressClickRef = useRef(false);
  const shape = useConstructorStore((s) => s.shape);
  const activeDecorations = useConstructorStore((s) => s.activeDecorations);
  const decorationInstances = useConstructorStore((s) => s.decorationInstances);
  const selectedDecorationInstanceId = useConstructorStore((s) => s.selectedDecorationInstanceId);
  const inscription = useConstructorStore((s) => s.inscription);
  const ingredients = useConstructorStore((s) => s.ingredients);
  const addDecorationInstance = useConstructorStore((s) => s.addDecorationInstance);
  const selectDecorationInstance = useConstructorStore((s) => s.selectDecorationInstance);
  const duplicateDecorationInstance = useConstructorStore((s) => s.duplicateDecorationInstance);
  const removeDecorationInstance = useConstructorStore((s) => s.removeDecorationInstance);
  const clearDecorations = useConstructorStore((s) => s.clearDecorations);
  const setInscription = useConstructorStore((s) => s.setInscription);
  const getConfig = useConstructorStore((s) => s.getConfig);
  const safeActiveDecorations = Array.isArray(activeDecorations) ? activeDecorations : [];
  const safeDecorationInstances = Array.isArray(decorationInstances) ? decorationInstances : [];
  const safeInscription = inscription ?? '';

  const decoOptionsByVisualKey = new Map<string, IngredientDecoration>();
  for (const decoration of ingredients?.decorations ?? []) {
    if (
      decoration.available &&
      isDecoVisualKeyAvailable(shape as CakeShape, decoration.visualKey) &&
      !decoOptionsByVisualKey.has(decoration.visualKey)
    ) {
      decoOptionsByVisualKey.set(decoration.visualKey, decoration);
    }
  }
  const decoOptions = Array.from(decoOptionsByVisualKey.values());
  const groupedDecoOptions = DECORATION_CATEGORY_ORDER.map((category) => ({
    category,
    label: getDecorationUiCategoryLabel(category),
    options: decoOptions.filter((option) => getDecorationUiCategory(option.visualKey) === category),
  })).filter((group) => group.options.length > 0);
  const maxLength = getConfig()?.maxInscriptionLength ?? 50;

  useEffect(() => () => pendingDragRef.current?.cleanup(), []);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="font-heading font-semibold text-[var(--color-graphite)] text-sm uppercase tracking-wide mb-3">
          Украшения
        </h3>

        <div className="flex flex-col gap-3">
          {groupedDecoOptions.map((group) => (
            <section key={group.category} className="flex flex-col gap-2">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-[var(--color-graphite-light)]">
                {group.label}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {group.options.map((option) => {
                  const isActive = safeActiveDecorations.includes(option.visualKey);
                  const placementLabel = getDecorationAllowedSurfacesLabel(option.visualKey);
                  const count = safeDecorationInstances.filter(
                    (instance) => instance.visualKey === option.visualKey,
                  ).length;
                  const isOptionDisabled = false;
                  const handleClick = () => {
                    if (suppressClickRef.current) {
                      suppressClickRef.current = false;
                      return;
                    }
                    if (isOptionDisabled) return;
                    addDecorationInstance(option.visualKey, option.id);
                  };
                  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
                    if (isOptionDisabled || event.button !== 0) return;

                    pendingDragRef.current?.cleanup();
                    const dragState: PendingDecorationDrag = {
                      visualKey: option.visualKey,
                      decorationId: option.id,
                      startX: event.clientX,
                      startY: event.clientY,
                      moved: false,
                      cleanup: () => undefined,
                    };

                    const cleanup = () => {
                      document.removeEventListener('pointermove', handlePointerMove);
                      document.removeEventListener('pointerup', handlePointerUp);
                      document.removeEventListener('pointercancel', handlePointerCancel);
                    };
                    const handlePointerMove = (moveEvent: PointerEvent) => {
                      const distance = Math.hypot(
                        moveEvent.clientX - dragState.startX,
                        moveEvent.clientY - dragState.startY,
                      );
                      if (distance > 8) dragState.moved = true;
                    };
                    const handlePointerUp = (upEvent: PointerEvent) => {
                      cleanup();
                      pendingDragRef.current = null;

                      if (!dragState.moved) return;

                      suppressClickRef.current = true;
                      window.dispatchEvent(new CustomEvent<DecorationPointerDropDetail>(
                        DECORATION_POINTER_DROP_EVENT,
                        {
                          detail: {
                            visualKey: dragState.visualKey,
                            decorationId: dragState.decorationId,
                            clientX: upEvent.clientX,
                            clientY: upEvent.clientY,
                          },
                        },
                      ));
                    };
                    const handlePointerCancel = () => {
                      cleanup();
                      pendingDragRef.current = null;
                    };

                    dragState.cleanup = cleanup;
                    pendingDragRef.current = dragState;
                    document.addEventListener('pointermove', handlePointerMove);
                    document.addEventListener('pointerup', handlePointerUp);
                    document.addEventListener('pointercancel', handlePointerCancel);
                  };

                  return (
                    <motion.button
                      key={option.visualKey}
                      onClick={handleClick}
                      onPointerDown={handlePointerDown}
                      disabled={isOptionDisabled}
                      className={cn(
                        'relative flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all duration-150 ease-out cursor-pointer',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2',
                        isActive
                          ? 'border-[var(--color-caramel)] bg-[var(--color-caramel)]/5 shadow-sm'
                          : isOptionDisabled
                            ? 'border-[var(--color-champagne)] opacity-40 cursor-not-allowed'
                            : 'border-[var(--color-champagne)] hover:border-[var(--color-caramel)]/40'
                      )}
                      whileTap={!isOptionDisabled ? { scale: 0.985 } : undefined}
                    >
                      <div className="flex items-start justify-between w-full gap-1">
                        <span className="text-xs font-semibold text-[var(--color-graphite)] leading-tight">
                          {option.name}
                        </span>
                        <div
                          className={cn(
                            'w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors',
                            isActive
                              ? 'bg-[var(--color-caramel)] border-[var(--color-caramel)]'
                              : 'border-[var(--color-champagne)] bg-transparent'
                          )}
                        >
                          {isActive ? (
                            <span className="text-[9px] font-bold text-white">{count}</span>
                          ) : (
                            <Plus size={9} className="text-[var(--color-graphite-light)]" strokeWidth={3} />
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-[var(--color-graphite-light)] leading-tight">
                          {new Intl.NumberFormat('ru-RU').format(option.pricePerUnit / 100)} ₽
                        </span>
                        <span className="inline-flex items-center rounded-full border border-[var(--color-champagne)] bg-[var(--color-milk-white)] px-1.5 py-0.5 text-[9px] font-medium leading-none text-[var(--color-graphite-light)]">
                          {placementLabel}
                        </span>
                      </div>
                      <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-[var(--color-graphite-light)]">
                        <Grip size={10} />
                        Нажмите или перетащите на торт
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </section>
          ))}

          <button
            type="button"
            onClick={clearDecorations}
            disabled={safeDecorationInstances.length === 0}
            className={cn(
              'col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all duration-150 ease-out cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2',
              safeDecorationInstances.length === 0
                ? 'border-[var(--color-caramel)] bg-[var(--color-caramel)]/5 shadow-sm opacity-40 cursor-not-allowed'
                : 'border-[var(--color-champagne)] hover:border-[var(--color-caramel)]/40'
            )}
          >
            <X size={12} className="text-[var(--color-graphite-light)]" />
            <span className="text-xs font-semibold text-[var(--color-graphite)]">
              Убрать все украшения
            </span>
          </button>
        </div>
      </div>

      {safeDecorationInstances.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="font-heading font-semibold text-[var(--color-graphite)] text-sm uppercase tracking-wide">
            Размещённый декор
          </h3>
          <div className="flex flex-col gap-2">
            {safeDecorationInstances.map((instance, index) => {
              const decoration = ingredients?.decorations.find((item) => item.id === instance.decorationId);
              const isSelected = selectedDecorationInstanceId === instance.instanceId;
              const canDuplicate = !getDecorationReplacementGroup(instance.visualKey);
              return (
                <div
                  key={instance.instanceId}
                  className={cn(
                    'flex items-center justify-between gap-3 rounded-xl border px-3 py-2 transition-colors',
                    isSelected
                      ? 'border-[var(--color-caramel)] bg-[var(--color-caramel)]/10'
                      : 'border-[var(--border-subtle)] bg-[var(--surface-secondary)]',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => selectDecorationInstance(instance.instanceId)}
                    className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2"
                  >
                    <p className="truncate text-xs font-semibold text-[var(--color-graphite)]">
                      {decoration?.name ?? `Декор ${index + 1}`} #{index + 1}
                    </p>
                    <p className="text-[10px] text-[var(--color-graphite-light)]">
                      X {instance.position.x.toFixed(2)} · Z {instance.position.z.toFixed(2)} · R{' '}
                      {Math.round(instance.rotation?.x ?? 0)}/{Math.round(instance.rotation?.y ?? 0)}/
                      {Math.round(instance.rotation?.z ?? 0)}
                    </p>
                  </button>
                  <div className="flex flex-shrink-0 items-center gap-1">
                    {canDuplicate && (
                      <button
                        type="button"
                        onClick={() => duplicateDecorationInstance(instance.instanceId)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--color-graphite-light)] transition hover:border-[var(--color-caramel)]/40 hover:text-[var(--color-caramel)] disabled:opacity-40"
                        aria-label="Дублировать декор"
                      >
                        <Copy size={13} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeDecorationInstance(instance.instanceId)}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--color-graphite-light)] transition hover:border-red-300 hover:text-red-500"
                      aria-label="Удалить декор"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h3 className="font-heading font-semibold text-[var(--color-graphite)] text-sm uppercase tracking-wide">
            Надпись на торте
          </h3>
          <span
            className={cn(
              'text-xs font-medium',
              safeInscription.length >= maxLength
                ? 'text-red-500'
                : safeInscription.length > maxLength * 0.8
                  ? 'text-orange-500'
                  : 'text-[var(--color-graphite-light)]'
            )}
          >
            {safeInscription.length}/{maxLength}
          </span>
        </div>
        <div className="relative">
          <input
            id={inscriptionInputId}
            name="cake-inscription"
            type="text"
            value={safeInscription}
            onChange={(e) => setInscription(e.target.value)}
            placeholder="Например: «С Днём Рождения, Аня!»"
            maxLength={maxLength}
            className={cn(
              'w-full px-4 py-3 rounded-xl border text-sm text-[var(--color-graphite)] placeholder:text-[var(--color-graphite-light)]/40 bg-[var(--color-milk-white)] transition-colors outline-none',
              'border-[var(--color-champagne)] focus:border-[var(--color-caramel)] focus:ring-1 focus:ring-[var(--color-caramel)]/30'
            )}
          />
          {safeInscription.length > 0 && (
            <button
              type="button"
              onClick={() => setInscription('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[var(--surface-secondary)] hover:bg-[var(--border-default)] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X size={10} className="text-[var(--color-graphite-light)]" />
            </button>
          )}
        </div>
        <p className="text-xs text-[var(--color-graphite-light)]">
          Надпись наносится кремом или шоколадом по желанию
        </p>
      </div>
    </div>
  );
}
