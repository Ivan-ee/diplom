'use client';

import { useMemo, Component, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { CakeShape } from '@/lib/constructor/model-registry';
import { getGlazeModelPath } from '@/lib/constructor/model-registry';
import type { CoatingVisual } from '@/stores/constructor-store';
import { applyCoatingShader } from './GlbCoatingShader';

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
  visual: CoatingVisual;
  yOffset: number;
}

interface GlazeModelProps {
  url: string;
  topY: number;
  visual: CoatingVisual;
}

function GlazeModel({ url, topY, visual }: GlazeModelProps) {
  const gltf = useGLTF(url);
  const clonedScene = useMemo(() => {
    const clone = gltf.scene.clone(true);
    applyCoatingShader(clone, visual);
    return clone;
  }, [gltf.scene, visual]);
  const topOffset = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    return Number.isFinite(box.max.y) ? -box.max.y : 0;
  }, [clonedScene]);

  return (
    <group position={[0, topY, 0]}>
      <primitive object={clonedScene} position={[0, topOffset, 0]} />
    </group>
  );
}

function GlbGlazeInner({ shape, glazeVariant, withDrips, visual, yOffset }: GlbGlazeProps) {
  const url = getGlazeModelPath(shape, glazeVariant, withDrips);
  if (!url) return null;

  return <GlazeModel url={url} topY={yOffset} visual={visual} />;
}

export function GlbGlaze(props: GlbGlazeProps) {
  return (
    <GlbErrorBoundary>
      <GlbGlazeInner {...props} />
    </GlbErrorBoundary>
  );
}
