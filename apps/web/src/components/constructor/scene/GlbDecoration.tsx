'use client';

import { useMemo, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { CakeShape } from '@/lib/constructor/model-registry';
import { getDecoModelPath, getCandleModelPath } from '@/lib/constructor/model-registry';
import { useConstructorStore, type DecorationPosition } from '@/stores/constructor-store';

interface GlbDecorationProps {
  instanceId: string;
  shape: CakeShape;
  decorVariant: string;
  yOffset: number;
  position: DecorationPosition;
}

function DecoModel({
  instanceId,
  url,
  yOffset,
  position,
}: {
  instanceId: string;
  url: string;
  yOffset: number;
  position: DecorationPosition;
}) {
  const gltf = useGLTF(url);
  const moveDecorationInstance = useConstructorStore((s) => s.moveDecorationInstance);
  const { gl } = useThree();
  const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -yOffset), [yOffset]);
  const isDraggingRef = useRef(false);
  const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const bottomOffset = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    return Number.isFinite(box.min.y) ? -box.min.y : 0;
  }, [clonedScene]);

  const moveToPointer = (event: ThreeEvent<PointerEvent>) => {
    const next = new THREE.Vector3();
    if (!event.ray.intersectPlane(dragPlane, next)) return;
    moveDecorationInstance(instanceId, {
      x: THREE.MathUtils.clamp(next.x, -0.9, 0.9),
      y: yOffset,
      z: THREE.MathUtils.clamp(next.z, -0.9, 0.9),
    });
  };

  return (
    <group
      position={[position.x, yOffset, position.z]}
      onPointerDown={(event) => {
        event.stopPropagation();
        isDraggingRef.current = true;
        gl.domElement.setPointerCapture(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (!isDraggingRef.current) return;
        event.stopPropagation();
        moveToPointer(event);
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
        isDraggingRef.current = false;
        if (gl.domElement.hasPointerCapture(event.pointerId)) {
          gl.domElement.releasePointerCapture(event.pointerId);
        }
      }}
      onPointerCancel={(event) => {
        isDraggingRef.current = false;
        if (gl.domElement.hasPointerCapture(event.pointerId)) {
          gl.domElement.releasePointerCapture(event.pointerId);
        }
      }}
    >
      <primitive object={clonedScene} position={[0, bottomOffset, 0]} />
    </group>
  );
}

export function GlbDecoration({ instanceId, shape, decorVariant, yOffset, position }: GlbDecorationProps) {
  const url = getDecoModelPath(shape, decorVariant);
  if (!url) return null;

  return <DecoModel instanceId={instanceId} url={url} yOffset={yOffset} position={position} />;
}

interface GlbCandleProps {
  shape: CakeShape;
  yOffset: number;
}

function CandleModel({ url, yOffset }: { url: string; yOffset: number }) {
  const gltf = useGLTF(url);
  const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const bottomOffset = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    return Number.isFinite(box.min.y) ? -box.min.y : 0;
  }, [clonedScene]);

  return (
    <group position={[0, yOffset, 0]}>
      <primitive object={clonedScene} position={[0, bottomOffset, 0]} />
    </group>
  );
}

export function GlbCandle({ shape, yOffset }: GlbCandleProps) {
  const url = getCandleModelPath(shape);

  return <CandleModel url={url} yOffset={yOffset} />;
}
