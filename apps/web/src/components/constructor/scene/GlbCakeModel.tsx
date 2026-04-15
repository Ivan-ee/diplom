'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useSpring, animated } from '@react-spring/three';
import { useConstructorStore } from '@/stores/constructor-store';
import type { CakeLayer, CakeCoating, ConstructorCatalog } from '@/stores/constructor-store';
import type { CakeShape } from '@/lib/constructor/model-registry';
import { GlbTier } from './GlbTier';
import { GlbGlaze } from './GlbGlaze';
import { GlbDecoration, GlbCandle } from './GlbDecoration';

interface ShapeTierConfig {
  shape: CakeShape;
  tierCount: number;
}

interface FadingCakeGroupProps {
  config: ShapeTierConfig;
  layers: CakeLayer[];
  coating: CakeCoating;
  activeDecorations: string[];
  hasCandle: boolean;
  ingredients: ConstructorCatalog | null;
  direction: 'in' | 'out';
  onRest?: () => void;
}

function getBaseVariant(baseId: string, ingredients: ConstructorCatalog | null): string {
  const base = ingredients?.bases.find((b) => b.id === baseId);
  if (!base) return 'default';
  const name = base.name.toLowerCase();
  if (name.includes('красн') || name.includes('бархат')) return 'red';
  if (name.includes('шоколад')) return 'choco';
  if (name.includes('вишн')) return 'cherry';
  return 'default';
}

function getFillVariant(fillingId: string, ingredients: ConstructorCatalog | null): string {
  const filling = ingredients?.fillings.find((f) => f.id === fillingId);
  if (!filling) return 'cream';
  const cat = filling.category;
  if (cat === 'chocolate') return 'choco';
  if (cat === 'honey') return 'pink';
  if (cat === 'specialty') return 'meringue';
  return 'cream';
}

function getWeightScale(weight: number): number {
  return Math.max(0.6, Math.min(1.5, weight / 1500));
}

function FadingCakeGroup({
  config,
  layers,
  coating,
  activeDecorations,
  hasCandle,
  ingredients,
  direction,
  onRest,
}: FadingCakeGroupProps) {
  const [spring] = useSpring(() => ({
    from: { scaleVal: direction === 'in' ? 0.9 : 1.0 },
    to: { scaleVal: direction === 'in' ? 1.0 : 0.9 },
    config: { duration: 220, easing: (t: number) => t * (2 - t) },
    onRest: direction === 'out' ? onRest : undefined,
  }));

  return (
    <animated.group scale={spring.scaleVal}>
      {Array.from({ length: config.tierCount }, (_, i) => {
        const layer = layers[i];
        const isBigTier = i === 0 && config.tierCount > 1;
        const showFill = i < config.tierCount - 1;
        return (
          <GlbTier
            key={i}
            shape={config.shape}
            baseVariant={getBaseVariant(layer?.baseId ?? '', ingredients)}
            fillVariant={getFillVariant(layer?.fillingId ?? '', ingredients)}
            isBigTier={isBigTier}
            showFill={showFill}
            yOffset={0}
            weightScale={getWeightScale(layer?.weight ?? 1000)}
          />
        );
      })}

      <GlbGlaze
        shape={config.shape}
        glazeVariant={coating.glazeVariant}
        withDrips={coating.withDrips}
        yOffset={0}
        colorMode={coating.colorMode}
        secondaryGlazeVariant={coating.secondaryGlazeVariant}
      />

      {activeDecorations.map((variantId, i) => (
        <GlbDecoration
          key={variantId}
          shape={config.shape}
          decorVariant={variantId}
          yOffset={i * 0.002}
        />
      ))}

      {hasCandle && (
        <GlbCandle
          shape={config.shape}
          yOffset={0}
        />
      )}
    </animated.group>
  );
}

export function GlbCakeModel() {
  const shape = useConstructorStore((s) => s.shape);
  const tierCount = useConstructorStore((s) => s.tierCount);
  const layers = useConstructorStore((s) => s.layers);
  const coating = useConstructorStore((s) => s.coating);
  const activeDecorations = useConstructorStore((s) => s.activeDecorations);
  const hasCandle = useConstructorStore((s) => s.hasCandle);
  const ingredients = useConstructorStore((s) => s.ingredients);

  const [crossfade, setCrossfade] = useState<{
    current: ShapeTierConfig;
    prev: ShapeTierConfig | null;
    transitionId: number;
  }>(() => ({ current: { shape, tierCount }, prev: null, transitionId: 0 }));

  const isFirstMount = useRef(true);
  const prevConfigRef = useRef<ShapeTierConfig>({ shape, tierCount });

  useEffect(() => {
    const incoming = { shape, tierCount };
    const prev = prevConfigRef.current;
    if (prev.shape === incoming.shape && prev.tierCount === incoming.tierCount) return;

    prevConfigRef.current = incoming;
    setCrossfade((c) => ({
      current: incoming,
      prev: c.current,
      transitionId: c.transitionId + 1,
    }));
  }, [shape, tierCount]);

  const clearPrev = useCallback(() => {
    setCrossfade((c) => ({ ...c, prev: null }));
  }, []);

  const [mountSpring, mountApi] = useSpring(() => ({
    scaleVal: 0.85,
    config: { mass: 1, tension: 200, friction: 22 },
  }));

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      mountApi.start({ scaleVal: 1 });
    }
  }, [mountApi]);

  return (
    <animated.group scale={mountSpring.scaleVal}>
      {crossfade.prev && (
        <FadingCakeGroup
          key={`prev-${crossfade.transitionId}`}
          config={crossfade.prev}
          direction="out"
          onRest={clearPrev}
          layers={layers}
          coating={coating}
          activeDecorations={activeDecorations}
          hasCandle={hasCandle}
          ingredients={ingredients}
        />
      )}
      <FadingCakeGroup
        key={`current-${crossfade.transitionId}`}
        config={crossfade.current}
        direction="in"
        layers={layers}
        coating={coating}
        activeDecorations={activeDecorations}
        hasCandle={hasCandle}
        ingredients={ingredients}
      />
    </animated.group>
  );
}
