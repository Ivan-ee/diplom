'use client';

import type { ComponentType } from 'react';
import { RotateCcw, ScanEye, Sparkles, SquareStack, View } from 'lucide-react';
import { CakeViewport } from './scene/CakeViewport';
import { SettingsPanel } from './panels/SettingsPanel';
import { useConstructorStore, type CakeShape, type TierCount, type ViewMode } from '@/stores/constructor-store';
import {
  isDecoVisualKeyAvailable,
  isFillVisualKeyAvailable,
  isFullTierVisualKeyAvailable,
  isGlazeVisualKeyAvailable,
  getGlazeColor,
} from '@/lib/constructor/model-registry';
import { cn } from '@/lib/utils';

const VIEW_MODES: Array<{ id: ViewMode; label: string; icon: ComponentType<{ size?: number }> }> = [
  { id: 'orbit', label: '360', icon: View },
  { id: 'top', label: 'Сверху', icon: SquareStack },
  { id: 'focus', label: 'Фокус', icon: ScanEye },
];

const PRESETS = [
  { label: 'Классика', shape: 'circle', tierCount: 1, base: 'default', filling: 'cream', coating: 'cream', decor: ['cream'] },
  { label: 'Шоколад', shape: 'circle', tierCount: 2, bases: ['choco', 'red'], fillings: ['choco', 'cream'], coating: 'cream', decor: ['cream'] },
  { label: 'Бархат', shape: 'heart', tierCount: 1, base: 'red', filling: 'cream', coating: 'pink', decor: ['chocolate-pink'] },
  { label: 'Ягоды', shape: 'circle', tierCount: 1, base: 'default', filling: 'pink', coating: 'milk', decor: ['blueberry'] },
  { label: 'Праздник', shape: 'square', tierCount: 3, base: 'default', filling: 'glaze-cream', coating: 'cream', decor: ['meringue', 'candle'] },
  { label: 'Минимал', shape: 'square', tierCount: 1, base: 'default', filling: 'glaze-cream', coating: 'cream', decor: [] },
] as const;

function ConstructorCommandBar() {
  const ingredients = useConstructorStore((s) => s.ingredients);
  const viewMode = useConstructorStore((s) => s.viewMode);
  const setViewMode = useConstructorStore((s) => s.setViewMode);
  const reset = useConstructorStore((s) => s.reset);

  const isPresetAvailable = (preset: (typeof PRESETS)[number]) => {
    if (!ingredients) return false;

    const shape = preset.shape as CakeShape;
    const baseKeys = 'bases' in preset ? preset.bases : [preset.base];
    const hasBase = baseKeys.some((visualKey) =>
      ingredients.bases.some(
        (item) =>
          item.available &&
          item.visualKey === visualKey &&
          isFullTierVisualKeyAvailable(shape, item.visualKey),
      ),
    );
    const hasCoating = ingredients.coatings.some(
      (item) => item.available && item.visualKey === preset.coating && isGlazeVisualKeyAvailable(shape, item.visualKey),
    );

    return hasBase && hasCoating;
  };

  const applyPreset = (preset: (typeof PRESETS)[number]) => {
    if (!ingredients || !isPresetAvailable(preset)) return;

    const shape = preset.shape as CakeShape;
    const tierCount = preset.tierCount as TierCount;
    const findBase = (visualKey: string) =>
      ingredients.bases.find(
        (item) =>
          item.available &&
          item.visualKey === visualKey &&
          isFullTierVisualKeyAvailable(shape, item.visualKey),
      ) ??
      ingredients.bases.find(
        (item) =>
          item.available &&
          isFullTierVisualKeyAvailable(shape, item.visualKey),
      );
    const findFilling = (visualKey: string) =>
      ingredients.fillings.find(
        (item) =>
          item.available &&
          item.visualKey === visualKey &&
          isFillVisualKeyAvailable(shape, item.visualKey),
      ) ??
      ingredients.fillings.find(
        (item) => item.available && isFillVisualKeyAvailable(shape, item.visualKey),
      );
    const coating = ingredients.coatings.find(
      (item) =>
        item.available &&
        item.visualKey === preset.coating &&
        isGlazeVisualKeyAvailable(shape, item.visualKey),
    ) ??
      ingredients.coatings.find(
        (item) => item.available && isGlazeVisualKeyAvailable(shape, item.visualKey),
      );
    const decorations = preset.decor
      .map((visualKey) =>
        ingredients.decorations.find(
          (item) =>
            item.available &&
            item.visualKey === visualKey &&
            isDecoVisualKeyAvailable(shape, item.visualKey),
        ),
      )
      .filter(Boolean);
    const decorationInstances = decorations.map((item, index) => ({
      instanceId: `preset-${preset.label}-${index}`,
      decorationId: item!.id,
      visualKey: item!.visualKey,
      position: {
        x: (index - (decorations.length - 1) / 2) * 0.22,
        y: 0,
        z: index % 2 === 0 ? 0.08 : -0.08,
      },
    }));
    const groupedDecorations = Array.from(
      decorationInstances.reduce((map, instance) => {
        const current = map.get(instance.decorationId);
        if (current) {
          current.quantity += 1;
        } else {
          map.set(instance.decorationId, {
            variantId: instance.visualKey,
            decorationId: instance.decorationId,
            quantity: 1,
          });
        }
        return map;
      }, new Map<string, { variantId: string; decorationId: string; quantity: number }>())
      .values(),
    );

    useConstructorStore.setState({
      shape,
      tierCount,
      layers: Array.from({ length: tierCount }, (_, index) => ({
        baseId: findBase('bases' in preset ? preset.bases[index] ?? preset.bases.at(-1) ?? 'default' : preset.base)?.id ?? '',
        fillingId: findFilling('fillings' in preset ? preset.fillings[index] ?? preset.fillings.at(-1) ?? 'cream' : preset.filling)?.id ?? '',
        weight: 1000,
      })),
      coating: {
        type: coating?.type ?? 'cream',
        coatingId: coating?.id ?? '',
        glazeVariant: coating?.visualKey ?? 'cream',
        withDrips: false,
        colorMode: 'solid',
        visual: {
          mode: 'solid',
          primaryColor: getGlazeColor(coating?.visualKey ?? 'cream'),
        },
      },
      activeDecorations: Array.from(new Set(decorationInstances.map((item) => item.visualKey))),
      selectedDecorations: groupedDecorations,
      decorationInstances,
      pricingStatus: 'stale',
      priceError: null,
      priceVerifiedAt: null,
    });
    useConstructorStore.getState().recalculatePrice();
  };

  return (
    <div className="flex h-16 items-center justify-between gap-4 border-b border-white/10 bg-[#151311] px-4">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d8b37a]/15 text-[#d8b37a]">
          <Sparkles size={17} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#d8b37a]">
            Cake Atelier Pro
          </p>
          <p className="truncate text-sm text-white/70">Студия сборки конфигурации торта</p>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-x-auto">
        {PRESETS.map((preset) => {
          const available = isPresetAvailable(preset);
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyPreset(preset)}
              disabled={!available}
              title={available ? preset.label : 'Для пресета нужна чистая full-tier GLB-модель'}
              className={cn(
                'whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition',
                available
                  ? 'border-white/10 bg-white/[0.04] text-white/70 hover:border-[#d8b37a]/40 hover:text-white'
                  : 'cursor-not-allowed border-white/5 bg-white/[0.02] text-white/25',
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex rounded-full border border-white/10 bg-black/20 p-1">
          {VIEW_MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setViewMode(id)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition',
                viewMode === id ? 'bg-[#d8b37a] text-[#17120d]' : 'text-white/60 hover:text-white',
              )}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={reset}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:text-white"
          aria-label="Сбросить конфигурацию"
        >
          <RotateCcw size={15} />
        </button>
      </div>
    </div>
  );
}

export function ConstructorLayout() {
  return (
    <>
      <div className="hidden h-[calc(100dvh-64px)] overflow-hidden bg-[#100f0e] lg:flex lg:flex-col">
        <ConstructorCommandBar />

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_420px]">
          <div className="relative h-full bg-[radial-gradient(circle_at_50%_30%,#fff9ef_0%,#f4e7d4_42%,#c9b38f_100%)]">
            <CakeViewport className="h-full w-full" />
          </div>

          <div className="min-h-0 border-l border-white/10 bg-[#f7f0e7]">
            <SettingsPanel />
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100dvh-64px)] flex-col overflow-hidden lg:hidden">
        <div className="relative h-[34dvh] min-h-[220px] max-h-[320px] flex-shrink-0 border-b border-[var(--color-champagne)] bg-gradient-to-b from-[var(--color-warm-ivory)] to-[var(--color-milk-white)]">
          <CakeViewport className="h-full w-full" />
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <SettingsPanel showSpecSummary={false} />
        </div>
      </div>
    </>
  );
}
