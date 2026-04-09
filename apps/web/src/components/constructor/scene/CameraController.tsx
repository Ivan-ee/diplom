'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useConstructorStore } from '@/stores/constructor-store';

// ---------------------------------------------------------------------------
// Height calculation — mirrors the formula used in CakeModel.
// weight is stored in grams; each tier height = weightG / 1500, clamped [0.4, 2.0].
// ---------------------------------------------------------------------------
const TIER_HEIGHT_MIN = 0.4;
const TIER_HEIGHT_MAX = 2.0;
const TIER_HEIGHT_DIVISOR = 1500;

function tierHeight(weightG: number): number {
  return Math.max(TIER_HEIGHT_MIN, Math.min(TIER_HEIGHT_MAX, weightG / TIER_HEIGHT_DIVISOR));
}

// Smooth lerp speed — fraction of remaining distance closed per second.
// At 60 fps this gives ~500 ms to close 98 % of the gap (1 - 0.92^30 ≈ 0.92).
const LERP_SPEED = 4.5;

// Distance is a linear function of total height.
// At default 1-tier height (1000 g → ~0.667): 5.0 + 0.667 * 0.8 ≈ 5.53 ≈ 5.5 (matches brief).
const DISTANCE_BASE = 5.0;
const DISTANCE_HEIGHT_FACTOR = 0.8;

export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Store subscriptions
  const tierCount = useConstructorStore((s) => s.tierCount);
  const layers = useConstructorStore((s) => s.layers);

  // Total cake height derived from layers
  const totalHeight = useMemo(
    () => layers.reduce((sum, l) => sum + tierHeight(l.weight), 0),
    [layers],
  );

  // Ideal camera distance and vertical target centre
  const idealDistance = DISTANCE_BASE + totalHeight * DISTANCE_HEIGHT_FACTOR;
  const idealTargetY = totalHeight / 2;

  // Refs that drive the useFrame lerp — plain refs so the closure is always fresh
  const targetDistanceRef = useRef(idealDistance);
  const targetCenterYRef = useRef(idealTargetY);
  const isAnimatingRef = useRef(false);

  // Track previous tierCount so we only trigger on real changes (not on mount)
  const prevTierCountRef = useRef<number | null>(null);

  // On tier-count change: update lerp targets and activate animation.
  // We explicitly guard against the very first render (prevTierCount === null).
  useEffect(() => {
    if (prevTierCountRef.current === null) {
      // First mount — set refs silently without animating
      prevTierCountRef.current = tierCount;
      targetDistanceRef.current = idealDistance;
      targetCenterYRef.current = idealTargetY;
      return;
    }

    if (prevTierCountRef.current === tierCount) return;

    prevTierCountRef.current = tierCount;
    targetDistanceRef.current = idealDistance;
    targetCenterYRef.current = idealTargetY;
    isAnimatingRef.current = true;
  }, [tierCount, idealDistance, idealTargetY]);

  // One-time entry animation: rotate 15 degrees on first mount (preserved from original)
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

  // Per-frame lerp: smoothly move camera distance and orbit target centre.
  // Runs inside the R3F render loop — no competing rAF with OrbitControls damping.
  useFrame((_state, delta) => {
    if (!isAnimatingRef.current) return;

    const controls = controlsRef.current;
    if (!controls) return;

    const camera = controls.object as THREE.PerspectiveCamera;
    const lerpFactor = 1 - Math.exp(-LERP_SPEED * delta);

    // --- Distance: move camera radially, preserving user's theta/phi ---
    const currentPos = camera.position.clone();
    const currentDistance = currentPos.length();
    const newDistance = currentDistance + (targetDistanceRef.current - currentDistance) * lerpFactor;

    if (currentDistance > 0.001) {
      camera.position.multiplyScalar(newDistance / currentDistance);
    }

    // --- Orbit target Y: shift the vertical centre the camera orbits around ---
    const currentTargetY = controls.target.y;
    const newTargetY = currentTargetY + (targetCenterYRef.current - currentTargetY) * lerpFactor;
    controls.target.y = newTargetY;

    controls.update();

    // Stop animating once both values are close enough
    const distanceDone = Math.abs(newDistance - targetDistanceRef.current) < 0.005;
    const targetDone = Math.abs(newTargetY - targetCenterYRef.current) < 0.005;
    if (distanceDone && targetDone) {
      isAnimatingRef.current = false;
    }
  });

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
