'use client';

import { useEffect, useRef } from 'react';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';

export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const camera = controls.object;
    const startPos = camera.position.clone();
    const spherical = new THREE.Spherical().setFromVector3(startPos);
    const startTheta = spherical.theta;
    const targetTheta = startTheta + (15 * Math.PI) / 180;
    const duration = 1500;
    const startTime = performance.now();

    let rafId: number;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const theta = startTheta + (targetTheta - startTheta) * eased;

      spherical.theta = theta;
      camera.position.setFromSpherical(spherical);
      camera.lookAt(controls.target);
      controls.update();

      if (t < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableDamping
      dampingFactor={0.05}
      minDistance={3}
      maxDistance={12}
      minPolarAngle={Math.PI * 0.1}
      maxPolarAngle={Math.PI * 0.85}
      makeDefault
    />
  );
}
