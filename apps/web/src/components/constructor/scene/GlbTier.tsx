'use client';

import { useMemo } from 'react';
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

  if (!layerPath) return null;

  return (
    <GlbTierInner
      layerPath={layerPath}
      yOffset={yOffset}
    />
  );
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
