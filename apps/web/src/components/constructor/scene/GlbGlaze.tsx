'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  Component,
  type ReactNode,
} from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
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
  yOffset: number;
}

interface GlazeModelProps {
  url: string;
  topY: number;
}

function GlazeModel({ url, topY }: GlazeModelProps) {
  const gltf = useGLTF(url);
  const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
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

function GlbGlazeInner({ shape, glazeVariant, yOffset }: GlbGlazeProps) {
  const url = getGlazeModelPath(shape, glazeVariant, false);
  const requestedGlazeUrlRef = useRef(url);
  const [visibleGlazeUrl, setVisibleGlazeUrl] = useState<string | null>(url);

  useEffect(() => {
    requestedGlazeUrlRef.current = url;

    if (!url) {
      setVisibleGlazeUrl(null);
      return;
    }

    setVisibleGlazeUrl((current) => current ?? url);
  }, [url]);

  const handleModelReady = useCallback((readyUrl: string) => {
    if (requestedGlazeUrlRef.current !== readyUrl) return;
    setVisibleGlazeUrl(readyUrl);
  }, []);

  if (!url) return null;

  return (
    <>
      {visibleGlazeUrl && (
        <Suspense fallback={null}>
          <GlazeModel url={visibleGlazeUrl} topY={yOffset} />
        </Suspense>
      )}
      {url !== visibleGlazeUrl && (
        <Suspense fallback={null}>
          <GlbGlazeModelPreloader
            url={url}
            onReady={handleModelReady}
          />
        </Suspense>
      )}
    </>
  );
}

function GlbGlazeModelPreloader({
  url,
  onReady,
}: {
  url: string;
  onReady: (url: string) => void;
}) {
  const gltf = useGLTF(url);

  useEffect(() => {
    onReady(url);
  }, [gltf.scene, onReady, url]);

  return null;
}

export function GlbGlaze(props: GlbGlazeProps) {
  return (
    <GlbErrorBoundary>
      <GlbGlazeInner {...props} />
    </GlbErrorBoundary>
  );
}
