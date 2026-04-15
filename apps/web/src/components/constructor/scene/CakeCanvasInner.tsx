'use client';

import { Suspense, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { SceneSetup } from './SceneSetup';
import { GlbCakeModel } from './GlbCakeModel';
import { glRef } from '@/lib/screenshot-ref';

function CakeLoadingFallback() {
  return (
    <mesh position={[0, 0.5, 0]}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color="#c4a08a" wireframe />
    </mesh>
  );
}

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
      <SceneSetup />
      <Suspense fallback={<CakeLoadingFallback />}>
        <GlbCakeModel />
      </Suspense>
    </Canvas>
  );
}
