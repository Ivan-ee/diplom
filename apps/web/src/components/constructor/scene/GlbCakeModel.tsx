'use client';

import { useMemo } from 'react';
import { normalizeCoating, useConstructorStore } from '@/stores/constructor-store';
import type {
  CakeLayer,
  CakeCoating,
  ConstructorCatalog,
  DecorationInstance,
} from '@/stores/constructor-store';
import type { CakeShape } from '@/lib/constructor/model-registry';
import { buildCakeStackLayout } from '@/lib/constructor/geometry';
import { GlbTier } from './GlbTier';
import { GlbGlaze } from './GlbGlaze';
import { GlbDecoration } from './GlbDecoration';

interface ShapeTierConfig {
  shape: CakeShape;
  tierCount: number;
}

interface CakeModelGroupProps {
  config: ShapeTierConfig;
  layers: CakeLayer[];
  coating: CakeCoating;
  decorationInstances: DecorationInstance[];
  ingredients: ConstructorCatalog | null;
}

function getBaseVariant(baseId: string, ingredients: ConstructorCatalog | null): string {
  const base = ingredients?.bases.find((b) => b.id === baseId);
  return base?.visualKey ?? 'default';
}

function getFillVariant(fillingId: string, ingredients: ConstructorCatalog | null): string {
  const filling = ingredients?.fillings.find((f) => f.id === fillingId);
  return filling?.visualKey ?? 'cream';
}

function CakeModelGroup({
  config,
  layers,
  coating,
  decorationInstances,
  ingredients,
}: CakeModelGroupProps) {
  const visualTiers = useMemo(
    () =>
      Array.from({ length: config.tierCount }, (_, i) => {
        const layer = layers[i];
        return {
          baseVariant: getBaseVariant(layer?.baseId ?? '', ingredients),
          fillVariant: getFillVariant(layer?.fillingId ?? '', ingredients),
          showFill: i < config.tierCount - 1,
        };
      }),
    [config.tierCount, ingredients, layers],
  );

  const layout = useMemo(
    () =>
      buildCakeStackLayout({
        shape: config.shape,
        tiers: visualTiers,
        glazeVariant: coating.glazeVariant,
        withDrips: coating.withDrips,
        decorations: decorationInstances.map((instance) => ({
          instanceId: instance.instanceId,
          variantId: instance.visualKey,
          position: instance.position,
        })),
      }),
    [decorationInstances, coating.glazeVariant, coating.withDrips, config.shape, visualTiers],
  );

  return (
    <>
      {layout.tiers.map((tier) => {
        const visualTier = visualTiers[tier.index];
        const showFill = tier.index < config.tierCount - 1;
        return (
          <GlbTier
            key={tier.index}
            shape={config.shape}
            baseVariant={visualTier?.baseVariant ?? 'default'}
            fillVariant={visualTier?.fillVariant ?? 'cream'}
            showFill={showFill}
            yOffset={tier.bottomY}
          />
        );
      })}

      {layout.glaze && (
        <GlbGlaze
          shape={config.shape}
          glazeVariant={coating.glazeVariant}
          withDrips={coating.withDrips}
          visual={coating.visual}
          yOffset={layout.glaze.topY}
        />
      )}

      {layout.decorations.map((decoration) => (
        <GlbDecoration
          key={decoration.instanceId}
          instanceId={decoration.instanceId}
          shape={config.shape}
          decorVariant={decoration.variantId}
          yOffset={decoration.bottomY}
          position={{ x: decoration.x, y: decoration.bottomY, z: decoration.z }}
        />
      ))}
    </>
  );
}

export function GlbCakeModel() {
  const shape = useConstructorStore((s) => s.shape);
  const tierCount = useConstructorStore((s) => s.tierCount);
  const layers = useConstructorStore((s) => s.layers);
  const coating = useConstructorStore((s) => s.coating);
  const decorationInstances = useConstructorStore((s) => s.decorationInstances);
  const ingredients = useConstructorStore((s) => s.ingredients);

  const config = useMemo(() => ({ shape, tierCount }), [shape, tierCount]);
  const normalizedCoating = useMemo(() => normalizeCoating(coating), [coating]);
  const normalizedLayers = useMemo(() => (Array.isArray(layers) ? layers : []), [layers]);
  const normalizedDecorationInstances = useMemo(
    () => (Array.isArray(decorationInstances) ? decorationInstances : []),
    [decorationInstances],
  );

  return (
    <CakeModelGroup
      config={config}
      layers={normalizedLayers}
      coating={normalizedCoating}
      decorationInstances={normalizedDecorationInstances}
      ingredients={ingredients}
    />
  );
}
