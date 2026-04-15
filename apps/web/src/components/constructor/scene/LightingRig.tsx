'use client';

import { Environment } from '@react-three/drei';

export function LightingRig() {
  return (
    <>
      <ambientLight intensity={0.15} />

      {/* Key light — upper right front */}
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.8}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.1}
        shadow-camera-far={30}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />

      {/* Fill light — upper left rear */}
      <directionalLight position={[-5, 3, -5]} intensity={0.25} />

      {/* Accent light — left upper */}
      <directionalLight position={[-3, 5, 3]} intensity={0.3} color="#ffd9c8" />

      <Environment preset="apartment" />
    </>
  );
}
