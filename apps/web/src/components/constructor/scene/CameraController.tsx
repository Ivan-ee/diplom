'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { normalizeCoating, useConstructorStore } from '@/stores/constructor-store';
import { buildCakeStackLayout } from '@/lib/constructor/geometry';
import {
  computeConstructorCameraFrame,
  type ConstructorCameraFrame,
} from '@/lib/constructor/camera-framing';

// Smooth lerp speed — fraction of remaining distance closed per second.
// At 60 fps this gives ~500 ms to close 98 % of the gap (1 - 0.92^30 ≈ 0.92).
const LERP_SPEED = 4.5;

function getCameraPose(frame: ConstructorCameraFrame, viewMode: 'orbit' | 'top' | 'focus') {
  if (viewMode === 'top') {
    return {
      position: new THREE.Vector3(0, frame.targetY + frame.topDistance, 0.01),
      target: new THREE.Vector3(0, frame.targetY, 0),
    };
  }

  if (viewMode === 'focus') {
    return {
      position: new THREE.Vector3(2.2, frame.focusTargetY + 1.0, frame.focusDistance),
      target: new THREE.Vector3(0, frame.focusTargetY, 0),
    };
  }

  return {
    position: new THREE.Vector3(0, frame.targetY + frame.orbitYOffset, frame.orbitDistance),
    target: new THREE.Vector3(0, frame.targetY, 0),
  };
}

export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();

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
      tiers: safeLayers.slice(0, tierCount).map((layer) => ({
        baseVariant: ingredients?.bases.find((base) => base.id === layer.baseId)?.visualKey ?? 'default',
      })),
      glazeVariant: safeCoating.glazeVariant,
      withDrips: false,
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
    safeDecorationInstances,
    safeLayers,
    shape,
    tierCount,
  ]);

  const cameraFov = camera instanceof THREE.PerspectiveCamera ? camera.fov : 45;
  const cameraFrame = useMemo(
    () =>
      computeConstructorCameraFrame({
        totalHeight,
        fovDeg: cameraFov,
        aspect: size.width / Math.max(size.height, 1),
      }),
    [cameraFov, size.height, size.width, totalHeight],
  );
  const cameraPose = useMemo(() => getCameraPose(cameraFrame, viewMode), [cameraFrame, viewMode]);

  // Refs that drive the useFrame lerp — plain refs so the closure is always fresh.
  const targetPositionRef = useRef(cameraPose.position.clone());
  const targetControlsTargetRef = useRef(cameraPose.target.clone());
  const isAnimatingRef = useRef(false);
  const hasAppliedInitialPoseRef = useRef(false);

  // Any change that affects stack height or viewport size updates the camera frame.
  // The render loop only mutates refs/camera objects; React state is not touched from useFrame.
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const camera = controls.object as THREE.PerspectiveCamera;
    targetPositionRef.current.copy(cameraPose.position);
    targetControlsTargetRef.current.copy(cameraPose.target);

    if (!hasAppliedInitialPoseRef.current) {
      camera.position.copy(cameraPose.position);
      controls.target.copy(cameraPose.target);
      camera.lookAt(controls.target);
      controls.update();
      hasAppliedInitialPoseRef.current = true;
      return;
    }

    isAnimatingRef.current = true;
  }, [cameraPose]);

  // Per-frame lerp: smoothly move camera position and orbit target.
  // Runs inside the R3F render loop — no competing rAF with OrbitControls damping.
  useFrame((_state, delta) => {
    if (!isAnimatingRef.current) return;

    const controls = controlsRef.current;
    if (!controls) return;

    const camera = controls.object as THREE.PerspectiveCamera;
    const lerpFactor = 1 - Math.exp(-LERP_SPEED * delta);

    camera.position.lerp(targetPositionRef.current, lerpFactor);
    controls.target.lerp(targetControlsTargetRef.current, lerpFactor);
    camera.lookAt(controls.target);
    controls.update();

    const positionDone = camera.position.distanceTo(targetPositionRef.current) < 0.01;
    const targetDone = controls.target.distanceTo(targetControlsTargetRef.current) < 0.005;
    if (positionDone && targetDone) {
      isAnimatingRef.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableDamping
      dampingFactor={0.05}
      minDistance={cameraFrame.minDistance}
      maxDistance={cameraFrame.maxDistance}
      minPolarAngle={Math.PI * 0.1}
      maxPolarAngle={Math.PI * 0.85}
      makeDefault
    />
  );
}
