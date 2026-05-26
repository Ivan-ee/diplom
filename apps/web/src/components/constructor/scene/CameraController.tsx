'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { normalizeCoating, useConstructorStore } from '@/stores/constructor-store';
import { buildCakeStackLayout } from '@/lib/constructor/geometry';

// Smooth lerp speed — fraction of remaining distance closed per second.
// At 60 fps this gives ~500 ms to close 98 % of the gap (1 - 0.92^30 ≈ 0.92).
const LERP_SPEED = 4.5;

// Keep camera distance independent from tier count: GLB size must not appear
// smaller just because the Конфигурация торта has more Ярусы.
const ORBIT_DISTANCE = 5.6;
const TOP_VIEW_DISTANCE = 5.4;
const FOCUS_DISTANCE = 4.4;

export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Store subscriptions
  const shape = useConstructorStore((s) => s.shape);
  const tierCount = useConstructorStore((s) => s.tierCount);
  const layers = useConstructorStore((s) => s.layers);
  const coating = useConstructorStore((s) => s.coating);
  const decorationInstances = useConstructorStore((s) => s.decorationInstances);
  const ingredients = useConstructorStore((s) => s.ingredients);
  const viewMode = useConstructorStore((s) => s.viewMode);
  const safeLayers = Array.isArray(layers) ? layers : [];
  const safeDecorationInstances = Array.isArray(decorationInstances) ? decorationInstances : [];
  const safeCoating = normalizeCoating(coating);

  const totalHeight = useMemo(() => {
    const layout = buildCakeStackLayout({
      shape,
      tiers: safeLayers.slice(0, tierCount).map((layer, index) => ({
        baseVariant: ingredients?.bases.find((base) => base.id === layer.baseId)?.visualKey ?? 'default',
        fillVariant: ingredients?.fillings.find((filling) => filling.id === layer.fillingId)?.visualKey ?? 'cream',
        showFill: index < tierCount - 1,
      })),
      glazeVariant: safeCoating.glazeVariant,
      withDrips: safeCoating.withDrips,
      decorations: safeDecorationInstances.map((instance) => ({
        instanceId: instance.instanceId,
        variantId: instance.visualKey,
        position: instance.position,
      })),
    });

    return Math.max(layout.totalHeight, 0.6);
  }, [
    ingredients,
    safeCoating.glazeVariant,
    safeCoating.withDrips,
    safeDecorationInstances,
    safeLayers,
    shape,
    tierCount,
  ]);

  // Ideal camera distance and vertical target centre
  const idealDistance = ORBIT_DISTANCE;
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

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const camera = controls.object as THREE.PerspectiveCamera;
    const distance = targetDistanceRef.current;

    if (viewMode === 'top') {
      camera.position.set(0, idealTargetY + TOP_VIEW_DISTANCE, 0.01);
      controls.target.set(0, idealTargetY, 0);
    } else if (viewMode === 'focus') {
      camera.position.set(2.2, idealTargetY + 1.2, FOCUS_DISTANCE);
      controls.target.set(0, Math.max(0.35, totalHeight * 0.72), 0);
    } else {
      camera.position.set(0, idealTargetY + 2.4, distance);
      controls.target.set(0, idealTargetY, 0);
    }

    camera.lookAt(controls.target);
    controls.update();
  }, [viewMode, totalHeight, idealTargetY]);

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
