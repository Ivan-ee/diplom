'use client';

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { CakeShape } from '@/lib/constructor/model-registry';
import { getFullTierModelPath, getFillModelPath } from '@/lib/constructor/model-registry';

interface GlbTierProps {
  shape: CakeShape;
  baseVariant: string;
  fillVariant: string;
  showFill: boolean;
  yOffset: number;
}

export function GlbTier({
  shape,
  baseVariant,
  fillVariant,
  showFill,
  yOffset,
}: GlbTierProps) {
  const layerPath = getFullTierModelPath(shape, baseVariant);
  const fillPath = getFillModelPath(shape, fillVariant);

  if (!layerPath) return null;

  return (
    <GlbTierInner
      layerPath={layerPath}
      fillPath={fillPath}
      showFill={showFill}
      yOffset={yOffset}
    />
  );
}

function GlbTierInner({
  layerPath,
  fillPath,
  showFill,
  yOffset,
}: {
  layerPath: string;
  fillPath: string | null;
  showFill: boolean;
  yOffset: number;
}) {
  const layerGltf = useGLTF(layerPath);
  const fillGltf = useGLTF(fillPath ?? layerPath);

  const clonedLayer = useMemo(() => layerGltf.scene.clone(true), [layerGltf.scene]);
  const clonedFill = useMemo(() => fillGltf.scene.clone(true), [fillGltf.scene]);
  const layerBottomOffset = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedLayer);
    return Number.isFinite(box.min.y) ? -box.min.y : 0;
  }, [clonedLayer]);
  const fillBottomOffset = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedFill);
    return Number.isFinite(box.min.y) ? -box.min.y : 0;
  }, [clonedFill]);

  return (
    <group position={[0, yOffset, 0]}>
      <primitive object={clonedLayer} position={[0, layerBottomOffset, 0]} />
      {showFill && fillPath && <primitive object={clonedFill} position={[0, fillBottomOffset, 0]} />}
    </group>
  );
}
