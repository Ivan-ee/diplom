'use client';

import { CameraController } from './CameraController';
import { LightingRig } from './LightingRig';
import { CakeStand } from './CakeStand';

export function SceneSetup() {
  return (
    <>
      <CameraController />
      <LightingRig />
      <CakeStand />
    </>
  );
}
