'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { CakeShape } from '@/lib/constructor/model-registry';
import { getFullTierModelPath } from '@/lib/constructor/model-registry';

interface GlbTierProps {
  shape: CakeShape;
  baseVariant: string;
  yOffset: number;
}

export function GlbTier({
  shape,
  baseVariant,
  yOffset,
}: GlbTierProps) {
  const layerPath = getFullTierModelPath(shape, baseVariant);
  const requestedLayerPathRef = useRef(layerPath);
  const [visibleLayerPath, setVisibleLayerPath] = useState<string | null>(layerPath);

  useEffect(() => {
    requestedLayerPathRef.current = layerPath;

    if (!layerPath) {
      setVisibleLayerPath(null);
      return;
    }

    setVisibleLayerPath((current) => current ?? layerPath);
  }, [layerPath]);

  const handleModelReady = useCallback((readyLayerPath: string) => {
    if (requestedLayerPathRef.current !== readyLayerPath) return;
    setVisibleLayerPath(readyLayerPath);
  }, []);

  if (!layerPath) return null;

  return (
    <>
      {visibleLayerPath && (
        <Suspense fallback={null}>
          <GlbTierInner
            layerPath={visibleLayerPath}
            yOffset={yOffset}
          />
        </Suspense>
      )}
      {layerPath !== visibleLayerPath && (
        <Suspense fallback={null}>
          <GlbTierModelPreloader
            layerPath={layerPath}
            onReady={handleModelReady}
          />
        </Suspense>
      )}
    </>
  );
}

function GlbTierModelPreloader({
  layerPath,
  onReady,
}: {
  layerPath: string;
  onReady: (layerPath: string) => void;
}) {
  const layerGltf = useGLTF(layerPath);

  useEffect(() => {
    onReady(layerPath);
  }, [layerGltf.scene, layerPath, onReady]);

  return null;
}

function GlbTierInner({
  layerPath,
  yOffset,
}: {
  layerPath: string;
  yOffset: number;
}) {
  const layerGltf = useGLTF(layerPath);

  const clonedLayer = useMemo(() => layerGltf.scene.clone(true), [layerGltf.scene]);
  const layerBottomOffset = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedLayer);
    return Number.isFinite(box.min.y) ? -box.min.y : 0;
  }, [clonedLayer]);

  return (
    <group position={[0, yOffset, 0]}>
      <primitive object={clonedLayer} position={[0, layerBottomOffset, 0]} />
    </group>
  );
}
