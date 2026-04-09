'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';
import type { CoatingDrips } from '@/stores/constructor-store';

interface DripsMeshProps {
  drips: CoatingDrips;
  tierRadius: number;
  tierTopY: number;
  shape: 'circle' | 'square' | 'heart';
}

interface DripConfig {
  angle: number;
  length: number;
  thickness: number;
  xOffset: number;
  zOffset: number;
}

function buildDripConfigs(
  count: number,
  intensity: number,
  tierRadius: number,
  shape: 'circle' | 'square' | 'heart',
  seed: number,
): DripConfig[] {
  const configs: DripConfig[] = [];
  // Intensity 10–100 maps to drip length 0.08–0.45
  const maxLength = 0.08 + (intensity / 100) * 0.37;

  for (let i = 0; i < count; i++) {
    // Deterministic pseudo-random variation per drip using seed
    const t = (i / count) * Math.PI * 2;
    // Small angular jitter — deterministic from index + seed
    const jitter = ((i * 137.508 + seed * 31.7) % 0.4) - 0.2;
    const angle = t + jitter;

    // Length variation per drip — longer drips cluster near center of each side
    const lengthVariation = 0.6 + ((i * 73.1 + seed * 17.3) % 40) / 100;
    const length = maxLength * lengthVariation;

    // Thickness 0.018–0.032, varies by index
    const thickness = 0.018 + ((i * 29.3 + seed * 11.1) % 14) / 1000;

    let xOffset: number;
    let zOffset: number;

    if (shape === 'circle') {
      // Place on circumference
      const edgeRadius = tierRadius - 0.04;
      xOffset = Math.cos(angle) * edgeRadius;
      zOffset = Math.sin(angle) * edgeRadius;
    } else if (shape === 'square') {
      // Place on perimeter of square
      const halfSide = tierRadius * 0.9;
      const perimeter = 4 * halfSide * 2;
      const pos = ((i / count) * perimeter + seed * 0.5) % perimeter;
      const segLen = halfSide * 2;
      if (pos < segLen) {
        xOffset = -halfSide + pos;
        zOffset = halfSide;
      } else if (pos < segLen * 2) {
        xOffset = halfSide;
        zOffset = halfSide - (pos - segLen);
      } else if (pos < segLen * 3) {
        xOffset = halfSide - (pos - segLen * 2);
        zOffset = -halfSide;
      } else {
        xOffset = -halfSide;
        zOffset = -halfSide + (pos - segLen * 3);
      }
    } else {
      // Heart — approximate as circle with reduced radius
      const edgeRadius = tierRadius * 0.7;
      xOffset = Math.cos(angle) * edgeRadius;
      zOffset = Math.sin(angle) * edgeRadius;
    }

    configs.push({ angle, length, thickness, xOffset, zOffset });
  }

  return configs;
}

function SingleDrip({
  config,
  color,
  tierTopY,
  targetScaleY,
}: {
  config: DripConfig;
  color: string;
  tierTopY: number;
  targetScaleY: number;
}) {
  const { scaleY } = useSpring({
    scaleY: targetScaleY,
    config: { mass: 1, tension: 180, friction: 26 },
  });

  // Capsule body geometry: thin cylinder with sphere caps
  const bodyGeometry = useMemo(() => {
    return new THREE.CylinderGeometry(
      config.thickness * 0.7, // top narrower
      config.thickness,       // bottom wider (gravity effect)
      config.length,
      8,
      1,
    );
  }, [config.thickness, config.length]);

  const capGeometry = useMemo(() => {
    return new THREE.SphereGeometry(config.thickness, 8, 6);
  }, [config.thickness]);

  // Center of the drip body sits at tierTopY minus half the drip length
  const bodyY = tierTopY - config.length / 2;
  const capY = tierTopY - config.length;

  return (
    <group position={[config.xOffset, 0, config.zOffset]}>
      {/* Body cylinder — animated scale along Y */}
      <animated.mesh
        geometry={bodyGeometry}
        position={[0, bodyY, 0]}
        scale-y={scaleY}
        castShadow
      >
        <meshStandardMaterial
          color={color}
          roughness={0.15}
          metalness={0.05}
        />
      </animated.mesh>

      {/* Rounded bottom cap */}
      <animated.mesh
        geometry={capGeometry}
        position={[0, capY, 0]}
        scale-y={scaleY}
        castShadow
      >
        <meshStandardMaterial
          color={color}
          roughness={0.15}
          metalness={0.05}
        />
      </animated.mesh>
    </group>
  );
}

export function DripsMesh({ drips, tierRadius, tierTopY, shape }: DripsMeshProps) {
  // Drip count: intensity 10–100 maps to 6–14 drips
  const dripCount = Math.round(6 + (drips.intensity / 100) * 8);

  // Use a stable seed derived from color to get consistent random look per color choice
  const seed = useMemo(() => {
    let s = 0;
    for (let i = 0; i < drips.color.length; i++) {
      s += drips.color.charCodeAt(i);
    }
    return s;
  }, [drips.color]);

  const dripConfigs = useMemo(
    () => buildDripConfigs(dripCount, drips.intensity, tierRadius, shape, seed),
    [dripCount, drips.intensity, tierRadius, shape, seed],
  );

  // Animate in when drips become enabled — targetScaleY 0 → 1
  const targetScaleY = drips.enabled ? 1 : 0;

  return (
    <group>
      {dripConfigs.map((config, i) => (
        <SingleDrip
          key={i}
          config={config}
          color={drips.color}
          tierTopY={tierTopY}
          targetScaleY={targetScaleY}
        />
      ))}
    </group>
  );
}
