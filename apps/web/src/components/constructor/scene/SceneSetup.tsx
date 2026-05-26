'use client';

import { CameraController } from './CameraController';
import { LightingRig } from './LightingRig';

export function SceneSetup() {
  return (
    <>
      <CameraController />
      <LightingRig />
    </>
  );
}
