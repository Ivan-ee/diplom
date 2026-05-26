'use client';

import * as THREE from 'three';
import type { CoatingVisual } from '@/stores/constructor-store';

export const COATING_SHADER_AMBIENT_FLOOR = 0.74;
export const COATING_SHADER_SHADOW_LIFT = 0.065;

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
  uniform vec4 uBoundsXZ;
  uniform float uMinY;
  uniform float uMaxY;
  uniform float uMode;
  uniform float uHasSecondaryColor;
  uniform float uAmbientFloor;
  uniform float uShadowLift;
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
      float ySpan = max(uMaxY - uMinY, 0.0001);
      float xSpan = max(uBoundsXZ.y - uBoundsXZ.x, 0.0001);
      float zSpan = max(uBoundsXZ.w - uBoundsXZ.z, 0.0001);
      float verticalGradient = clamp((vWorldPosition.y - uMinY) / ySpan, 0.0, 1.0);
      float xGradient = clamp((vWorldPosition.x - uBoundsXZ.x) / xSpan, 0.0, 1.0);
      float zGradient = clamp((vWorldPosition.z - uBoundsXZ.z) / zSpan, 0.0, 1.0);
      float diagonalGradient = smoothstep(0.05, 0.95, (xGradient + zGradient) * 0.5);
      float flatCap = 1.0 - smoothstep(0.08, 0.28, ySpan);
      float gradient = mix(verticalGradient, diagonalGradient, flatCap);
      baseColor = mix(uPrimaryColor, uSecondaryColor, gradient);
    }

    if (uMode == 2.0 && uHasSecondaryColor > 0.5) {
      float mask = splashMask(vWorldPosition);
      baseColor = mix(baseColor, uSecondaryColor, mask * 0.75);
    }

    float diffuse = max(dot(normalize(vNormal), normalize(vec3(0.3, 0.85, 0.45))), 0.0);
    float light = uAmbientFloor + diffuse * (1.0 - uAmbientFloor);
    vec3 liftedColor = min(baseColor * light + vec3(uShadowLift), vec3(1.0));
    gl_FragColor = vec4(liftedColor, 1.0);
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
  const bounds = new THREE.Box3().setFromObject(scene);
  const hasBounds = Number.isFinite(bounds.min.x) &&
    Number.isFinite(bounds.max.x) &&
    Number.isFinite(bounds.min.y) &&
    Number.isFinite(bounds.max.y) &&
    Number.isFinite(bounds.min.z) &&
    Number.isFinite(bounds.max.z);
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uPrimaryColor: { value: new THREE.Color(normalizedVisual.primaryColor) },
      uSecondaryColor: { value: new THREE.Color(secondaryColor) },
      uBoundsXZ: {
        value: new THREE.Vector4(
          hasBounds ? bounds.min.x : -0.5,
          hasBounds ? bounds.max.x : 0.5,
          hasBounds ? bounds.min.z : -0.5,
          hasBounds ? bounds.max.z : 0.5,
        ),
      },
      uMinY: { value: hasBounds ? bounds.min.y : 0 },
      uMaxY: { value: hasBounds ? bounds.max.y : 1 },
      uMode: { value: modeToUniform(normalizedVisual.mode) },
      uHasSecondaryColor: {
        value: normalizedVisual.secondaryColor || normalizedVisual.mode === 'splashes' ? 1 : 0,
      },
      uAmbientFloor: { value: COATING_SHADER_AMBIENT_FLOOR },
      uShadowLift: { value: COATING_SHADER_SHADOW_LIFT },
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
