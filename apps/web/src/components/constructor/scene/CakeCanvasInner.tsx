'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SceneSetup } from './SceneSetup';
import { GlbCakeModel } from './GlbCakeModel';
import { glRef } from '@/lib/screenshot-ref';
import { normalizeCoating, useConstructorStore } from '@/stores/constructor-store';
import { buildCakeStackLayout } from '@/lib/constructor/geometry';

/** Registers the WebGL renderer into the module-level glRef so that
 *  components outside the R3F tree (e.g. StepNavigation) can take screenshots. */
function GlRegistrar() {
  const { gl } = useThree();
  useEffect(() => {
    glRef.current = gl;
    return () => {
      glRef.current = null;
    };
  }, [gl]);
  return null;
}

function DecorationDropTarget() {
  const { gl, camera, raycaster } = useThree();
  const shape = useConstructorStore((s) => s.shape);
  const tierCount = useConstructorStore((s) => s.tierCount);
  const layers = useConstructorStore((s) => s.layers);
  const coating = useConstructorStore((s) => s.coating);
  const ingredients = useConstructorStore((s) => s.ingredients);
  const addDecorationInstance = useConstructorStore((s) => s.addDecorationInstance);
  const safeLayers = Array.isArray(layers) ? layers : [];
  const safeCoating = normalizeCoating(coating);

  const decorationBaseY = useMemo(() => {
    const layout = buildCakeStackLayout({
      shape,
      tiers: safeLayers.slice(0, tierCount).map((layer, index) => ({
        baseVariant: ingredients?.bases.find((base) => base.id === layer.baseId)?.visualKey ?? 'default',
        fillVariant: ingredients?.fillings.find((filling) => filling.id === layer.fillingId)?.visualKey ?? 'cream',
        showFill: index < tierCount - 1,
      })),
      glazeVariant: safeCoating.glazeVariant,
      withDrips: safeCoating.withDrips,
      decorations: [],
    });

    return layout.decorationBaseY;
  }, [ingredients, safeCoating.glazeVariant, safeCoating.withDrips, safeLayers, shape, tierCount]);

  useEffect(() => {
    const canvas = gl.domElement;
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -decorationBaseY);
    const pointer = new THREE.Vector2();
    const point = new THREE.Vector3();

    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
    };

    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      const raw =
        event.dataTransfer?.getData('application/x-bakery-decoration') ||
        event.dataTransfer?.getData('text/plain');
      if (!raw) return;

      let payload: { visualKey?: string; decorationId?: string };
      try {
        payload = JSON.parse(raw) as { visualKey?: string; decorationId?: string };
      } catch {
        return;
      }
      if (!payload.visualKey) return;

      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);

      if (!raycaster.ray.intersectPlane(plane, point)) return;

      addDecorationInstance(payload.visualKey, payload.decorationId, {
        x: THREE.MathUtils.clamp(point.x, -0.9, 0.9),
        y: decorationBaseY,
        z: THREE.MathUtils.clamp(point.z, -0.9, 0.9),
      });
    };

    canvas.addEventListener('dragover', handleDragOver);
    canvas.addEventListener('drop', handleDrop);

    return () => {
      canvas.removeEventListener('dragover', handleDragOver);
      canvas.removeEventListener('drop', handleDrop);
    };
  }, [addDecorationInstance, camera, decorationBaseY, gl.domElement, raycaster]);

  return null;
}

export default function CakeCanvasInner() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{
        preserveDrawingBuffer: true,
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 0.9,
      }}
      camera={{ position: [0, 3, 6], fov: 45 }}
      shadows
      style={{ width: '100%', height: '100%' }}
    >
      <GlRegistrar />
      <DecorationDropTarget />
      <SceneSetup />
      <Suspense fallback={null}>
        <GlbCakeModel />
      </Suspense>
    </Canvas>
  );
}
