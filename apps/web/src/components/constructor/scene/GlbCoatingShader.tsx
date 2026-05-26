'use client';

import * as THREE from 'three';
import type { CoatingVisual } from '@/stores/constructor-store';

const VERTEX_SHADER = `
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  void main() {
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;
  uniform float uMode;
  uniform float uHasSecondaryColor;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;

  float splashMask(vec3 p) {
    float a = sin(p.x * 31.0 + p.z * 17.0);
    float b = sin((p.x + p.z) * 47.0);
    return step(0.78, (a + b) * 0.25 + 0.5);
  }

  void main() {
    vec3 baseColor = uPrimaryColor;

    if (uMode == 1.0 && uHasSecondaryColor > 0.5) {
      float gradient = smoothstep(-0.35, 0.45, vWorldPosition.y);
      baseColor = mix(uPrimaryColor, uSecondaryColor, gradient);
    }

    if (uMode == 2.0 && uHasSecondaryColor > 0.5) {
      float mask = splashMask(vWorldPosition);
      baseColor = mix(baseColor, uSecondaryColor, mask * 0.75);
    }

    float light = 0.62 + max(dot(normalize(vNormal), normalize(vec3(0.3, 0.8, 0.4))), 0.0) * 0.38;
    gl_FragColor = vec4(baseColor * light, 1.0);
  }
`;

function modeToUniform(mode: CoatingVisual['mode']): number {
  if (mode === 'gradient') return 1;
  if (mode === 'splashes') return 2;
  return 0;
}

function normalizeShaderVisual(visual?: Partial<CoatingVisual> | null): CoatingVisual {
  const mode = visual?.mode === 'gradient' || visual?.mode === 'splashes' ? visual.mode : 'solid';
  return {
    mode,
    primaryColor: visual?.primaryColor ?? '#FFF5E0',
    secondaryColor: visual?.secondaryColor,
    splashes: visual?.splashes ?? mode === 'splashes',
  };
}

export function applyCoatingShader(scene: THREE.Object3D, visual?: Partial<CoatingVisual> | null): void {
  const normalizedVisual = normalizeShaderVisual(visual);
  const secondaryColor = normalizedVisual.secondaryColor ?? '#5C3D2E';
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uPrimaryColor: { value: new THREE.Color(normalizedVisual.primaryColor) },
      uSecondaryColor: { value: new THREE.Color(secondaryColor) },
      uMode: { value: modeToUniform(normalizedVisual.mode) },
      uHasSecondaryColor: {
        value: normalizedVisual.secondaryColor || normalizedVisual.mode === 'splashes' ? 1 : 0,
      },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
  });

  scene.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.material = material;
  });
}
