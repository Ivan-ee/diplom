'use client';

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { SceneSetup } from './SceneSetup';
import { CakeModel } from './CakeModel';

function CakeLoadingFallback() {
  return (
    <mesh position={[0, 0.5, 0]}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color="#c4a08a" wireframe />
    </mesh>
  );
}

export default function CakeCanvasInner() {
  return (
    <Canvas
      dpr={[1, 2]}
      gl={{
        preserveDrawingBuffer: true,
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.1,
      }}
      camera={{ position: [0, 3, 6], fov: 45 }}
      shadows
      style={{ width: '100%', height: '100%' }}
    >
      <SceneSetup />
      <Suspense fallback={<CakeLoadingFallback />}>
        <CakeModel />
      </Suspense>
    </Canvas>
  );
}
