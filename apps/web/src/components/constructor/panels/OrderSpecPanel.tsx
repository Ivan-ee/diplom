'use client';

import { CheckCircle2, Layers3, Sparkles } from 'lucide-react';
import { useConstructorStore } from '@/stores/constructor-store';
import { cn } from '@/lib/utils';
import { PriceCalculator } from './PriceCalculator';
import { StepNavigation } from './StepNavigation';

const SHAPE_LABELS: Record<string, string> = {
  circle: 'Круг',
  square: 'Квадрат',
  heart: 'Сердце',
};

function formatWeight(weight: number) {
  return weight >= 1000 ? `${(weight / 1000).toLocaleString('ru-RU')} кг` : `${weight} г`;
}

export function OrderSpecPanel() {
  const shape = useConstructorStore((s) => s.shape);
  const tierCount = useConstructorStore((s) => s.tierCount);
  const layers = useConstructorStore((s) => s.layers);
  const coating = useConstructorStore((s) => s.coating);
  const activeDecorations = useConstructorStore((s) => s.activeDecorations);
  const selectedDecorations = useConstructorStore((s) => s.selectedDecorations);
  const inscription = useConstructorStore((s) => s.inscription);
  const ingredients = useConstructorStore((s) => s.ingredients);
  const pricingStatus = useConstructorStore((s) => s.pricingStatus);
  const safeLayers = Array.isArray(layers) ? layers : [];
  const safeActiveDecorations = Array.isArray(activeDecorations) ? activeDecorations : [];
  const safeSelectedDecorations = Array.isArray(selectedDecorations) ? selectedDecorations : [];
  const safeInscription = inscription ?? '';

  const totalWeight = safeLayers.reduce((sum, layer) => sum + layer.weight, 0);
  const coatingName = ingredients?.coatings.find((item) => item.id === coating.coatingId)?.name;

  return (
    <aside className="flex h-full min-h-0 flex-col border-l border-white/10 bg-[#181513] text-white">
      <div className="border-b border-white/10 px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#d8b37a]">
              Спецификация
            </p>
            <h2 className="mt-1 font-heading text-lg font-semibold">
              {SHAPE_LABELS[shape]} · {tierCount} {tierCount === 1 ? 'ярус' : 'яруса'}
            </h2>
          </div>
          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full border',
              pricingStatus === 'verified'
                ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                : 'border-[#d8b37a]/30 bg-[#d8b37a]/10 text-[#d8b37a]',
            )}
          >
            <CheckCircle2 size={17} />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[11px] uppercase tracking-wide text-white/45">Вес</p>
            <p className="mt-1 text-sm font-semibold">{formatWeight(totalWeight)}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3">
            <p className="text-[11px] uppercase tracking-wide text-white/45">Декор</p>
            <p className="mt-1 text-sm font-semibold">{safeActiveDecorations.length} шт.</p>
          </div>
        </div>

        <section className="mt-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Layers3 size={15} className="text-[#d8b37a]" />
            Ярусы
          </div>
          <div className="space-y-2">
            {safeLayers.map((layer, index) => {
              const base = ingredients?.bases.find((item) => item.id === layer.baseId);
              const filling = ingredients?.fillings.find((item) => item.id === layer.fillingId);

              return (
                <div key={index} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-white/80">Ярус {index + 1}</p>
                    <span className="text-xs text-[#d8b37a]">{formatWeight(layer.weight)}</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-white/50">
                    {base?.name ?? 'Основа не выбрана'} / {filling?.name ?? 'начинка не выбрана'}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <Sparkles size={15} className="text-[#d8b37a]" />
            Отделка
          </div>
          <div className="space-y-2 text-xs text-white/55">
            <p>Покрытие: <span className="text-white/80">{coatingName ?? 'не выбрано'}</span></p>
            {safeSelectedDecorations.length > 0 && (
              <p>
                Декор:{' '}
                <span className="text-white/80">
                  {safeSelectedDecorations
                    .map((selection) => {
                      const decoration = ingredients?.decorations.find((item) => item.id === selection.decorationId);
                      return decoration ? `${decoration.name} x${selection.quantity}` : null;
                    })
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </p>
            )}
            {safeInscription.trim() && (
              <p>Надпись: <span className="text-white/80">«{safeInscription.trim()}»</span></p>
            )}
          </div>
        </section>
      </div>

      <div className="border-t border-white/10 bg-[#f7f0e7] text-[var(--color-graphite)]">
        <PriceCalculator />
        <StepNavigation />
      </div>
    </aside>
  );
}
