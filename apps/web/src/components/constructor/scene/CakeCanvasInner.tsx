'use client';

import { Suspense, useCallback, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SceneSetup } from './SceneSetup';
import { GlbCakeModel } from './GlbCakeModel';
import { DecorationSceneProvider, useDecorationScene } from './DecorationSceneContext';
import { findDecorationSurfacePlacement } from './decoration-placement';
import { glRef } from '@/lib/screenshot-ref';
import { useConstructorStore } from '@/stores/constructor-store';
import {
  DECORATION_POINTER_DROP_EVENT,
  type DecorationPointerDropDetail,
} from '@/lib/constructor/decoration-drag';
import { getDecorationAllowedSurfaces } from '@/lib/constructor/model-registry';
import { preloadDecoModels, preloadFullTierModels, preloadGlazeModels } from '@/lib/constructor/model-loader';

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
  const { getTierSurfaces } = useDecorationScene();
  const addDecorationInstance = useConstructorStore((s) => s.addDecorationInstance);

  useEffect(() => {
    const canvas = gl.domElement;
    const pointer = new THREE.Vector2();

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

      const hit = findDecorationSurfacePlacement(
        raycaster.ray,
        getTierSurfaces(),
        getDecorationAllowedSurfaces(payload.visualKey),
        raycaster,
      );

      if (!hit) return;
      addDecorationInstance(payload.visualKey, payload.decorationId, hit.position, hit.placement);
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
  }, [addDecorationInstance, camera, getTierSurfaces, gl.domElement, raycaster]);

  return null;
}

function FullTierModelPreloader() {
  const shape = useConstructorStore((s) => s.shape);

  useEffect(() => {
    preloadFullTierModels(shape);
    preloadGlazeModels(shape);
    preloadDecoModels(shape);
  }, [shape]);

  return null;
}

export default function CakeCanvasInner() {
  const selectDecorationInstance = useConstructorStore((s) => s.selectDecorationInstance);
  const handlePointerMissed = useCallback(() => {
    selectDecorationInstance(null);
  }, [selectDecorationInstance]);

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
      onPointerMissed={handlePointerMissed}
    >
      <DecorationSceneProvider>
        <GlRegistrar />
        <FullTierModelPreloader />
        <DecorationDropTarget />
        <SceneSetup />
        <Suspense fallback={null}>
          <GlbCakeModel />
        </Suspense>
      </DecorationSceneProvider>
    </Canvas>
  );
}
