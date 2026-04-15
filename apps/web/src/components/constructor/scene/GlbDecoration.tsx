'use client';

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import type { CakeShape } from '@/lib/constructor/model-registry';
import { getDecoModelPath, getCandleModelPath } from '@/lib/constructor/model-registry';

interface GlbDecorationProps {
  shape: CakeShape;
  decorVariant: string;
  yOffset: number;
}

function DecoModel({ url, yOffset }: { url: string; yOffset: number }) {
  const gltf = useGLTF(url);
  const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  return (
    <group position={[0, yOffset, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
}

export function GlbDecoration({ shape, decorVariant, yOffset }: GlbDecorationProps) {
  const url = getDecoModelPath(shape, decorVariant);
  if (!url) return null;

  return <DecoModel url={url} yOffset={yOffset} />;
}

interface GlbCandleProps {
  shape: CakeShape;
  yOffset: number;
}

function CandleModel({ url, yOffset }: { url: string; yOffset: number }) {
  const gltf = useGLTF(url);
  const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);

  return (
    <group position={[0, yOffset, 0]}>
      <primitive object={clonedScene} />
    </group>
  );
}

export function GlbCandle({ shape, yOffset }: GlbCandleProps) {
  const url = getCandleModelPath(shape);

  return <CandleModel url={url} yOffset={yOffset} />;
}
