'use client';

import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useSpring, animated } from '@react-spring/three';
import { useConstructorStore } from '@/stores/constructor-store';
import { DecorationInstance } from './DecorationInstance';

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

interface TierGeometryProps {
  shape: 'circle' | 'square' | 'heart';
  radius: number;
  height: number;
}

function TierMesh({ shape: cakeShape, radius, height, color, roughness, metalness }: TierGeometryProps & { color: string; roughness: number; metalness: number }) {
  const geometry = useMemo(() => {
    if (cakeShape === 'circle') {
      return new THREE.CylinderGeometry(radius, radius * 1.02, height, 64, 1);
    }
    if (cakeShape === 'square') {
      const geo = new THREE.BoxGeometry(radius * 1.8, height, radius * 1.8);
      return geo;
    }
    // Heart — extrude a heart shape
    const heartShape = buildHeartShape();
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: height,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 4,
    };
    const geo = new THREE.ExtrudeGeometry(heartShape, extrudeSettings);
    // Center and scale
    geo.center();
    geo.scale(radius, radius, 1);
    // Rotate so extrusion goes up Y
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

  return (
    <group>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color={color}
          roughness={roughness}
          metalness={metalness}
        />
      </mesh>
      {topGeometry && (
        <mesh geometry={topGeometry} position={[0, height / 2, 0]}>
          <meshStandardMaterial
            color={lightenColor(color, 0.12)}
            roughness={roughness * 0.8}
            metalness={metalness}
          />
        </mesh>
      )}
      {cakeShape === 'circle' && (
        <mesh position={[0, -height / 2 + 0.03, 0]}>
          <torusGeometry args={[radius, 0.025, 12, 64]} />
          <meshStandardMaterial
            color={lightenColor(color, 0.18)}
            roughness={0.2}
            metalness={0.1}
          />
        </mesh>
      )}
    </group>
  );
}

// Lighten a hex color by a factor 0–1
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

const TIER_RADII: Record<number, number[]> = {
  1: [1.3],
  2: [1.3, 0.95],
  3: [1.3, 0.95, 0.65],
};

export function CakeModel() {
  const shape = useConstructorStore((s) => s.shape);
  const tierCount = useConstructorStore((s) => s.tierCount);
  const layers = useConstructorStore((s) => s.layers);
  const coating = useConstructorStore((s) => s.coating);
  const decorations = useConstructorStore((s) => s.decorations);

  const prevKeyRef = useRef<string>('');
  const currentKey = `${shape}-${tierCount}`;
  const isFirstMount = useRef(true);

  // Spring for mount animation and shape/tier change transitions
  // Use a single scalar and apply it uniformly to avoid tuple typing issues
  const [spring, api] = useSpring(() => ({
    scaleVal: 0.85,
    config: { mass: 1, tension: 200, friction: 22 },
  }));

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      api.start({ scaleVal: 1 });
      prevKeyRef.current = currentKey;
      return;
    }
    if (prevKeyRef.current !== currentKey) {
      prevKeyRef.current = currentKey;
      api.start({
        to: async (next) => {
          await next({ scaleVal: 0.88 });
          await next({ scaleVal: 1 });
        },
        config: { mass: 1, tension: 260, friction: 20 },
      });
    }
  }, [currentKey, api]);

  const roughness = coating.type === 'cream' ? 0.4 : 0.8;
  const metalness = coating.type === 'cream' ? 0.02 : 0.0;
  const radii = TIER_RADII[tierCount] ?? [1.3];

  // Build cumulative Y positions for each tier
  const tierData = useMemo(() => {
    const data: Array<{ radius: number; height: number; yOffset: number }> = [];
    let cumulativeY = 0;

    for (let i = 0; i < tierCount; i++) {
      const layer = layers[i];
      // Height in scene units: weight in grams / 1500, clamped between 0.4 and 2.0
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
  }, [tierCount, layers, radii]);

  return (
    <animated.group scale={spring.scaleVal} position={[0, 0, 0]}>
      {tierData.map((tier, i) => (
        <group key={i} position={[0, tier.yOffset, 0]}>
          <TierMesh
            shape={shape}
            radius={tier.radius}
            height={tier.height}
            color={coating.color}
            roughness={roughness}
            metalness={metalness}
          />
        </group>
      ))}

      {/* Decorations */}
      {decorations.map((decor) => (
        <DecorationInstance key={decor.id} decoration={decor} />
      ))}
    </animated.group>
  );
}
