'use client';

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import type { CakeShape } from '@/lib/constructor/model-registry';
import { getLayerModelPath, getFillModelPath } from '@/lib/constructor/model-registry';

interface GlbTierProps {
  shape: CakeShape;
  baseVariant: string;
  fillVariant: string;
  isBigTier: boolean;
  showFill: boolean;
  yOffset: number;
  weightScale: number;
}

export function GlbTier({
  shape,
  baseVariant,
  fillVariant,
  isBigTier,
  showFill,
  yOffset,
  weightScale,
}: GlbTierProps) {
  const layerPath = getLayerModelPath(shape, baseVariant, isBigTier);
  const fillPath = getFillModelPath(shape, fillVariant);

  const layerGltf = useGLTF(layerPath);
  const fillGltf = useGLTF(fillPath);

  const clonedLayer = useMemo(() => layerGltf.scene.clone(true), [layerGltf.scene]);
  const clonedFill = useMemo(() => fillGltf.scene.clone(true), [fillGltf.scene]);

  return (
    <group position={[0, yOffset, 0]} scale={[1, weightScale, 1]}>
      <primitive object={clonedLayer} />
      {showFill && <primitive object={clonedFill} />}
    </group>
  );
}
