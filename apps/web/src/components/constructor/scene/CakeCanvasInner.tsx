'use client';

import { Suspense, useEffect, useMemo } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SceneSetup } from './SceneSetup';
import { GlbCakeModel } from './GlbCakeModel';
import { glRef } from '@/lib/screenshot-ref';
import { normalizeCoating, useConstructorStore } from '@/stores/constructor-store';
import { buildCakeStackLayout } from '@/lib/constructor/geometry';
import {
  DECORATION_POINTER_DROP_EVENT,
  type DecorationPointerDropDetail,
} from '@/lib/constructor/decoration-drag';
import { preloadFullTierModels } from '@/lib/constructor/model-loader';

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
      tiers: safeLayers.slice(0, tierCount).map((layer) => ({
        baseVariant: ingredients?.bases.find((base) => base.id === layer.baseId)?.visualKey ?? 'default',
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

    const placeDecoration = (payload: DecorationPointerDropDetail) => {
      if (!payload.visualKey) return;

      const rect = canvas.getBoundingClientRect();
      if (
        payload.clientX < rect.left ||
        payload.clientX > rect.right ||
        payload.clientY < rect.top ||
        payload.clientY > rect.bottom
      ) {
        return;
      }

      pointer.x = ((payload.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((payload.clientY - rect.top) / rect.height) * 2 - 1);
      raycaster.setFromCamera(pointer, camera);

      if (!raycaster.ray.intersectPlane(plane, point)) return;

      addDecorationInstance(payload.visualKey, payload.decorationId, {
        x: THREE.MathUtils.clamp(point.x, -0.9, 0.9),
        y: decorationBaseY,
        z: THREE.MathUtils.clamp(point.z, -0.9, 0.9),
      });
    };

    const handlePointerDrop = (event: Event) => {
      const detail = (event as CustomEvent<DecorationPointerDropDetail>).detail;
      if (!detail) return;
      placeDecoration(detail);
    };

    window.addEventListener(DECORATION_POINTER_DROP_EVENT, handlePointerDrop);

    return () => {
      window.removeEventListener(DECORATION_POINTER_DROP_EVENT, handlePointerDrop);
    };
  }, [addDecorationInstance, camera, decorationBaseY, gl.domElement, raycaster]);

  return null;
}

function FullTierModelPreloader() {
  const shape = useConstructorStore((s) => s.shape);

  useEffect(() => {
    preloadFullTierModels(shape);
  }, [shape]);

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
        toneMappingExposure: 1.25,
      }}
      camera={{ position: [0, 3, 6], fov: 45 }}
      shadows
      style={{ width: '100%', height: '100%' }}
    >
      <GlRegistrar />
      <FullTierModelPreloader />
      <DecorationDropTarget />
      <SceneSetup />
      <Suspense fallback={null}>
        <GlbCakeModel />
      </Suspense>
    </Canvas>
  );
}
