'use client';

import { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';
import { useConstructorStore, type CakeLayer, type CakeCoating, type ConstructorCatalog } from '@/stores/constructor-store';
import { DecorationInstance } from './DecorationInstance';
import { DripsMesh } from './DripsMesh';

function buildHeartShape(): THREE.Shape {
  const shape = new THREE.Shape();
  const x = 0;
  const y = 0;
  shape.moveTo(x, y + 0.5);
  shape.bezierCurveTo(x, y + 0.5, x - 0.1, y + 1.0, x - 0.5, y + 1.0);
  shape.bezierCurveTo(x - 1.0, y + 1.0, x - 1.0, y + 0.5, x - 1.0, y + 0.5);
  shape.bezierCurveTo(x - 1.0, y + 0.2, x - 0.75, y - 0.1, x, y - 0.5);
  shape.bezierCurveTo(x + 0.75, y - 0.1, x + 1.0, y + 0.2, x + 1.0, y + 0.5);
  shape.bezierCurveTo(x + 1.0, y + 0.5, x + 1.0, y + 1.0, x + 0.5, y + 1.0);
  shape.bezierCurveTo(x + 0.1, y + 1.0, x, y + 0.5, x, y + 0.5);
  return shape;
}

// ---------------------------------------------------------------------------
// Gradient canvas texture — built once, updated via useEffect
// ---------------------------------------------------------------------------

function createGradientTexture(
  colorStart: string,
  colorEnd: string,
  direction: 'vertical' | 'horizontal',
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');

  if (direction === 'vertical') {
    canvas.width = 1;
    canvas.height = size;
  } else {
    canvas.width = size;
    canvas.height = 1;
  }

  const ctx = canvas.getContext('2d')!;
  const grad =
    direction === 'vertical'
      ? ctx.createLinearGradient(0, 0, 0, size)
      : ctx.createLinearGradient(0, 0, size, 0);

  grad.addColorStop(0, colorStart);
  grad.addColorStop(1, colorEnd);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// ---------------------------------------------------------------------------
// Lighten utility
// ---------------------------------------------------------------------------

function lightenColor(hex: string, amount: number): string {
  try {
    const color = new THREE.Color(hex);
    color.r = Math.min(1, color.r + amount);
    color.g = Math.min(1, color.g + amount);
    color.b = Math.min(1, color.b + amount);
    return `#${color.getHexString()}`;
  } catch {
    return hex;
  }
}

// ---------------------------------------------------------------------------
// TierMesh
// ---------------------------------------------------------------------------

interface TierGeometryProps {
  shape: 'circle' | 'square' | 'heart';
  radius: number;
  height: number;
}

interface TierMeshProps extends TierGeometryProps {
  coatingColor: string;
  baseColor: string;
  roughness: number;
  metalness: number;
  gradientTexture: THREE.CanvasTexture | null;
}

function TierMesh({
  shape: cakeShape,
  radius,
  height,
  coatingColor,
  baseColor,
  roughness,
  metalness,
  gradientTexture,
}: TierMeshProps) {
  const geometry = useMemo(() => {
    if (cakeShape === 'circle') {
      return new THREE.CylinderGeometry(radius, radius * 1.02, height, 64, 1);
    }
    if (cakeShape === 'square') {
      return new THREE.BoxGeometry(radius * 1.8, height, radius * 1.8);
    }
    // Heart
    const heartShape = buildHeartShape();
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: height,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 4,
    };
    const geo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    geo.center();
    geo.scale(radius, radius, 1);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [cakeShape, radius, height]);

  // Frosting top disc for circle/square
  const topGeometry = useMemo(() => {
    if (cakeShape === 'circle') {
      return new THREE.CylinderGeometry(radius, radius, 0.04, 64);
    }
    if (cakeShape === 'square') {
      return new THREE.BoxGeometry(radius * 1.8, 0.04, radius * 1.8);
    }
    return null;
  }, [cakeShape, radius]);

  // Biscuit ring geometry — thin ring visible at the top edge of each tier,
  // showing the inner biscuit color. Rendered as a flat torus/annulus.
  const biscuitRingGeometry = useMemo(() => {
    if (cakeShape === 'circle') {
      // Annulus disc: outer = radius, inner = radius * 0.85, thin height
      return new THREE.CylinderGeometry(radius * 0.98, radius * 0.85, 0.045, 64, 1, false);
    }
    if (cakeShape === 'square') {
      // For square we use a slightly smaller box inset to simulate the cross-section
      return new THREE.BoxGeometry(radius * 1.6, 0.045, radius * 1.6);
    }
    return null;
  }, [cakeShape, radius]);

  const resolvedCoatingColor = gradientTexture ? '#FFFFFF' : coatingColor;

  return (
    <group>
      {/* Main coating body */}
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={resolvedCoatingColor}
          map={gradientTexture ?? undefined}
          roughness={roughness}
          metalness={metalness}
        />
      </mesh>

      {/* Frosting top disc */}
      {topGeometry && (
        <mesh geometry={topGeometry} position={[0, height / 2, 0]}>
          <meshStandardMaterial
            color={lightenColor(coatingColor, 0.12)}
            roughness={roughness * 0.8}
            metalness={metalness}
          />
        </mesh>
      )}

      {/* Biscuit ring — sits just below the top disc, shows base color */}
      {biscuitRingGeometry && (
        <mesh
          geometry={biscuitRingGeometry}
          position={[0, height / 2 - 0.025, 0]}
          renderOrder={1}
        >
          <meshStandardMaterial
            color={baseColor}
            roughness={0.75}
            metalness={0.0}
          />
        </mesh>
      )}

      {/* Bottom edge highlight ring — circle only */}
      {cakeShape === 'circle' && (
        <mesh position={[0, -height / 2 + 0.03, 0]}>
          <torusGeometry args={[radius, 0.025, 12, 64]} />
          <meshStandardMaterial
            color={lightenColor(coatingColor, 0.18)}
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>
      )}
    </group>
  );
}

// ---------------------------------------------------------------------------
// Tier radius presets
// ---------------------------------------------------------------------------

const TIER_RADII: Record<number, number[]> = {
  1: [1.3],
  2: [1.3, 0.95],
  3: [1.3, 0.95, 0.65],
};

// ---------------------------------------------------------------------------
// CakeModel
// ---------------------------------------------------------------------------

interface ShapeTierConfig {
  shape: 'circle' | 'square' | 'heart';
  tierCount: number;
}

export function CakeModel() {
  const shape = useConstructorStore((s) => s.shape);
  const tierCount = useConstructorStore((s) => s.tierCount);
  const layers = useConstructorStore((s) => s.layers);
  const coating = useConstructorStore((s) => s.coating);
  const decorations = useConstructorStore((s) => s.decorations);
  const ingredients = useConstructorStore((s) => s.ingredients);

  // ---------------------------------------------------------------------------
  // Crossfade state: track current and previous shape+tier configs
  // ---------------------------------------------------------------------------
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

  // Callback to clear the prev group once its fade-out completes
  const clearPrev = useCallback(() => {
    setCrossfade((c) => ({ ...c, prev: null }));
  }, []);

  // ---------------------------------------------------------------------------
  // Mount spring — scales up the whole assembly on first load (0.85 → 1)
  // ---------------------------------------------------------------------------
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

  // ---------------------------------------------------------------------------
  // Gradient texture — created in useMemo, kept alive in a ref, disposed on
  // change. This avoids recreating a texture every render frame.
  // ---------------------------------------------------------------------------
  const gradientTextureRef = useRef<THREE.CanvasTexture | null>(null);

  const gradientTexture = useMemo((): THREE.CanvasTexture | null => {
    // Dispose previous texture to avoid GPU memory leaks
    if (gradientTextureRef.current) {
      gradientTextureRef.current.dispose();
      gradientTextureRef.current = null;
    }

    if (!coating.gradient?.enabled) return null;

    const tex = createGradientTexture(
      coating.color,
      coating.gradient.gradientEndColor,
      coating.gradient.direction,
    );
    gradientTextureRef.current = tex;
    return tex;
  }, [
    coating.gradient?.enabled,
    coating.color,
    coating.gradient?.gradientEndColor,
    coating.gradient?.direction,
  ]);

  // Dispose texture on unmount
  useEffect(() => {
    return () => {
      gradientTextureRef.current?.dispose();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Material properties
  // ---------------------------------------------------------------------------
  const roughness = coating.type === 'cream' ? 0.4 : 0.8;
  const metalness = coating.type === 'cream' ? 0.02 : 0.0;

  return (
    <animated.group scale={mountSpring.scaleVal} position={[0, 0, 0]}>
      {/* Previous geometry — fades out (scale 1 → 0.9) */}
      {crossfade.prev !== null && (
        <FadingTierGroup
          key={`prev-${crossfade.transitionId}`}
          config={crossfade.prev}
          layers={layers}
          coating={coating}
          ingredients={ingredients}
          roughness={roughness}
          metalness={metalness}
          gradientTexture={gradientTexture}
          direction="out"
          onRest={clearPrev}
        />
      )}

      {/* Current geometry — fades in (scale 0.9 → 1) */}
      <FadingTierGroup
        key={`current-${crossfade.transitionId}`}
        config={crossfade.current}
        layers={layers}
        coating={coating}
        ingredients={ingredients}
        roughness={roughness}
        metalness={metalness}
        gradientTexture={gradientTexture}
        direction="in"
        onRest={undefined}
      />

      {/* Decorations — always follow current geometry */}
      {decorations.map((decor) => (
        <DecorationInstance key={decor.id} decoration={decor} />
      ))}
    </animated.group>
  );
}

// ---------------------------------------------------------------------------
// FadingTierGroup — renders a full cake stack for one ShapeTierConfig and
// animates its scale: "in" goes 0.9→1, "out" goes 1→0.9 then calls onRest.
// ---------------------------------------------------------------------------

interface FadingTierGroupProps {
  config: ShapeTierConfig;
  layers: CakeLayer[];
  coating: CakeCoating;
  ingredients: ConstructorCatalog | null;
  roughness: number;
  metalness: number;
  gradientTexture: THREE.CanvasTexture | null;
  direction: 'in' | 'out';
  onRest: (() => void) | undefined;
}

function FadingTierGroup({
  config,
  layers,
  coating,
  ingredients,
  roughness,
  metalness,
  gradientTexture,
  direction,
  onRest,
}: FadingTierGroupProps) {
  const radii = TIER_RADII[config.tierCount] ?? [1.3];

  const tierData = useMemo(() => {
    const data: Array<{ radius: number; height: number; yOffset: number }> = [];
    let cumulativeY = 0;

    for (let i = 0; i < config.tierCount; i++) {
      const layer = layers[i];
      const weightG = layer?.weight ?? 1000;
      const height = Math.max(0.4, Math.min(2.0, weightG / 1500));
      const radius = radii[i] ?? 1.3;

      if (i === 0) {
        cumulativeY = height / 2;
      } else {
        const prevHeight = data[i - 1]!.height;
        cumulativeY = data[i - 1]!.yOffset + prevHeight / 2 + height / 2 + 0.04;
      }

      data.push({ radius, height, yOffset: cumulativeY });
    }
    return data;
  }, [config.tierCount, layers, radii]);

  const topTier = tierData[tierData.length - 1];

  const [spring] = useSpring(() => ({
    from: { scaleVal: direction === 'in' ? 0.9 : 1.0 },
    to: { scaleVal: direction === 'in' ? 1.0 : 0.9 },
    config: { duration: 220, easing: (t: number) => t * (2 - t) },
    onRest: direction === 'out' ? onRest : undefined,
  }));

  return (
    <animated.group scale={spring.scaleVal}>
      {tierData.map((tier, i) => {
        const layer = layers[i];
        const baseColor =
          layer?.baseId && ingredients?.bases
            ? (ingredients.bases.find((b) => b.id === layer.baseId)?.color ?? '#FFF8E7')
            : '#FFF8E7';

        return (
          <group key={i} position={[0, tier.yOffset, 0]}>
            <TierMesh
              shape={config.shape}
              radius={tier.radius}
              height={tier.height}
              coatingColor={coating.color}
              baseColor={baseColor}
              roughness={roughness}
              metalness={metalness}
              gradientTexture={gradientTexture}
            />
          </group>
        );
      })}

      {/* Drips — only on current (in) group to avoid doubling */}
      {direction === 'in' && coating.drips?.enabled && topTier && (
        <DripsMesh
          drips={coating.drips}
          tierRadius={topTier.radius}
          tierTopY={topTier.yOffset + topTier.height / 2}
          shape={config.shape}
        />
      )}
    </animated.group>
  );
}
