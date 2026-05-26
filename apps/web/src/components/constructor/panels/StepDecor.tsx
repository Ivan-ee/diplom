'use client';

import { useEffect, useId, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { motion } from 'framer-motion';
import { Grip, Plus, Trash2, X } from 'lucide-react';
import { useConstructorStore } from '@/stores/constructor-store';
import { isDecoVisualKeyAvailable, type CakeShape } from '@/lib/constructor/model-registry';
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

export function StepDecor() {
  const inscriptionInputId = useId();
  const pendingDragRef = useRef<PendingDecorationDrag | null>(null);
  const suppressClickRef = useRef(false);
  const shape = useConstructorStore((s) => s.shape);
  const activeDecorations = useConstructorStore((s) => s.activeDecorations);
  const decorationInstances = useConstructorStore((s) => s.decorationInstances);
  const inscription = useConstructorStore((s) => s.inscription);
  const ingredients = useConstructorStore((s) => s.ingredients);
  const addDecorationInstance = useConstructorStore((s) => s.addDecorationInstance);
  const removeDecorationInstance = useConstructorStore((s) => s.removeDecorationInstance);
  const clearDecorations = useConstructorStore((s) => s.clearDecorations);
  const setInscription = useConstructorStore((s) => s.setInscription);
  const getConfig = useConstructorStore((s) => s.getConfig);
  const safeActiveDecorations = Array.isArray(activeDecorations) ? activeDecorations : [];
  const safeDecorationInstances = Array.isArray(decorationInstances) ? decorationInstances : [];
  const safeInscription = inscription ?? '';

  const decoOptions = Array.from(
    new Map(
      (ingredients?.decorations ?? [])
        .filter(
          (decoration) =>
            decoration.available &&
            isDecoVisualKeyAvailable(shape as CakeShape, decoration.visualKey),
        )
        .map((decoration) => [decoration.visualKey, decoration]),
    ).values(),
  );
  const maxLength = getConfig()?.maxInscriptionLength ?? 50;
  const maxDecorations = getConfig()?.maxDecorations ?? 3;
  const isMaxReached = safeDecorationInstances.length >= maxDecorations;

  useEffect(() => () => pendingDragRef.current?.cleanup(), []);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-[var(--color-graphite)] text-sm uppercase tracking-wide">
            Украшения
          </h3>
          <span
            className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full transition-colors',
              isMaxReached
                ? 'bg-[var(--color-caramel)]/10 text-[var(--color-caramel)]'
                : 'text-[var(--color-graphite-light)]'
            )}
          >
            {safeDecorationInstances.length}/{maxDecorations}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {decoOptions.map((option) => {
            const isActive = safeActiveDecorations.includes(option.visualKey);
            const count = safeDecorationInstances.filter(
              (instance) => instance.visualKey === option.visualKey,
            ).length;
            const handleClick = () => {
              if (suppressClickRef.current) {
                suppressClickRef.current = false;
                return;
              }
              addDecorationInstance(option.visualKey, option.id);
            };
            const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
              if (isMaxReached || event.button !== 0) return;

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
                disabled={isMaxReached}
                className={cn(
                  'relative flex flex-col items-start gap-1 p-3 rounded-xl border-2 text-left transition-all duration-150 ease-out cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-caramel)] focus-visible:ring-offset-2',
                  isActive
                    ? 'border-[var(--color-caramel)] bg-[var(--color-caramel)]/5 shadow-sm'
                    : isMaxReached
                      ? 'border-[var(--color-champagne)] opacity-40 cursor-not-allowed'
                      : 'border-[var(--color-champagne)] hover:border-[var(--color-caramel)]/40'
                )}
                whileTap={!isMaxReached ? { scale: 0.985 } : undefined}
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
                <span className="text-[10px] text-[var(--color-graphite-light)] leading-tight">
                  {option.category} · {new Intl.NumberFormat('ru-RU').format(option.pricePerUnit / 100)} ₽
                </span>
                <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-[var(--color-graphite-light)]">
                  <Grip size={10} />
                  Нажмите или перетащите на торт
                </span>
              </motion.button>
            );
          })}

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
              return (
                <div
                  key={instance.instanceId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-secondary)] px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-[var(--color-graphite)]">
                      {decoration?.name ?? `Декор ${index + 1}`}
                    </p>
                    <p className="text-[10px] text-[var(--color-graphite-light)]">
                      X {instance.position.x.toFixed(2)} · Z {instance.position.z.toFixed(2)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDecorationInstance(instance.instanceId)}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] text-[var(--color-graphite-light)] transition hover:border-red-300 hover:text-red-500"
                    aria-label="Удалить декор"
                  >
                    <Trash2 size={13} />
                  </button>
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
