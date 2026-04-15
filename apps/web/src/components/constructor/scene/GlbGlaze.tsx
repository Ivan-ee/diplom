'use client';

import { useMemo, useEffect, Component, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { CakeShape } from '@/lib/constructor/model-registry';
import { getGlazeModelPath, getGlazeColor } from '@/lib/constructor/model-registry';
import type { ColorMode } from '@/stores/constructor-store';

class GlbErrorBoundary extends Component<
  { fallback?: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error) {
    console.warn('[GlbGlaze] Failed to load model:', error.message);
  }
  render() {
    return this.state.hasError ? (this.props.fallback ?? null) : this.props.children;
  }
}

interface GlbGlazeProps {
  shape: CakeShape;
  glazeVariant: string;
  withDrips: boolean;
  yOffset: number;
  colorMode?: ColorMode;
  secondaryGlazeVariant?: string;
}

interface GlazeModelProps {
  url: string;
  yOffset: number;
  colorMode?: ColorMode;
  secondaryColor?: string;
}

function GlazeModel({ url, yOffset, colorMode, secondaryColor }: GlazeModelProps) {
  const gltf = useGLTF(url);
  const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  useEffect(() => {
    if (colorMode !== 'gradient' || !secondaryColor) return;

    const targetColor = new THREE.Color(secondaryColor);

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (mat.color) {
          const newMat = mat.clone();
          newMat.color = mat.color.clone().lerp(targetColor, 0.4);
          child.material = newMat;
        }
      }
    });
  }, [clonedScene, colorMode, secondaryColor]);

  return (
    <group position={[0, yOffset, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
}

function GlbGlazeInner({ shape, glazeVariant, withDrips, yOffset, colorMode, secondaryGlazeVariant }: GlbGlazeProps) {
  const effectiveDrips = colorMode === 'splashes' ? true : withDrips;
  const url = getGlazeModelPath(shape, glazeVariant, effectiveDrips);

  const secondaryColor = secondaryGlazeVariant
    ? getGlazeColor(secondaryGlazeVariant)
    : undefined;

  return (
    <GlazeModel
      url={url}
      yOffset={yOffset}
      colorMode={colorMode}
      secondaryColor={secondaryColor}
    />
  );
}

export function GlbGlaze(props: GlbGlazeProps) {
  return (
    <GlbErrorBoundary>
      <GlbGlazeInner {...props} />
    </GlbErrorBoundary>
  );
}
