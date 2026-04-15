'use client';

import { useMemo, Component, type ReactNode } from 'react';
import { useGLTF } from '@react-three/drei';
import type { CakeShape } from '@/lib/constructor/model-registry';
import { getGlazeModelPath } from '@/lib/constructor/model-registry';

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
}

function GlbGlazeInner({ shape, glazeVariant, withDrips, yOffset }: GlbGlazeProps) {
  const url = getGlazeModelPath(shape, glazeVariant, withDrips);
  const gltf = useGLTF(url);
  const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  return (
    <group position={[0, yOffset, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
}

export function GlbGlaze(props: GlbGlazeProps) {
  return (
    <GlbErrorBoundary>
      <GlbGlazeInner {...props} />
    </GlbErrorBoundary>
  );
}
