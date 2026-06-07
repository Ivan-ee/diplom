import * as THREE from 'three';
import { DECORATION_LIFT } from '@/lib/constructor/geometry';
import type {
  DecorationPlacement,
  DecorationPosition,
  DecorationRotation,
  DecorationSurface,
} from '@/stores/constructor-store';
import type { DecorationSurfaceRegistration } from './DecorationSceneContext';

const LOCAL_UP = new THREE.Vector3(0, 1, 0);
const DEFAULT_TOP_PLACEMENT: DecorationPlacement = {
  surface: 'top',
  tierIndex: 0,
  normal: { x: 0, y: 1, z: 0 },
};

export interface DecorationSurfacePlacementHit {
  position: DecorationPosition;
  placement: DecorationPlacement;
}

function normalizeNormal(normal?: Partial<DecorationPosition>): THREE.Vector3 {
  const vector = new THREE.Vector3(
    Number.isFinite(normal?.x) ? Number(normal?.x) : 0,
    Number.isFinite(normal?.y) ? Number(normal?.y) : 1,
    Number.isFinite(normal?.z) ? Number(normal?.z) : 0,
  );

  if (vector.lengthSq() <= 0.000001) return LOCAL_UP.clone();
  return vector.normalize();
}

function classifySurface(normal: THREE.Vector3): DecorationSurface | null {
  if (normal.y >= 0.65) return 'top';

  const horizontalStrength = Math.hypot(normal.x, normal.z);
  if (Math.abs(normal.y) <= 0.35 && horizontalStrength >= 0.65) return 'side';

  return null;
}

function ownsIntersection(registration: DecorationSurfaceRegistration, object: THREE.Object3D): boolean {
  let current: THREE.Object3D | null = object;
  while (current) {
    if (current === registration.object) return true;
    current = current.parent;
  }

  return false;
}

function findRegistration(
  registrations: DecorationSurfaceRegistration[],
  object: THREE.Object3D,
): DecorationSurfaceRegistration | null {
  return registrations.find((registration) => ownsIntersection(registration, object)) ?? null;
}

function getWorldNormal(intersection: THREE.Intersection): THREE.Vector3 | null {
  if (!intersection.face) return null;

  const normalMatrix = new THREE.Matrix3().getNormalMatrix(intersection.object.matrixWorld);
  return intersection.face.normal.clone().applyMatrix3(normalMatrix).normalize();
}

export function findDecorationSurfacePlacement(
  ray: THREE.Ray,
  registrations: DecorationSurfaceRegistration[],
  allowedSurfaces: DecorationSurface[],
  raycaster: THREE.Raycaster,
): DecorationSurfacePlacementHit | null {
  if (registrations.length === 0) return null;

  for (const registration of registrations) {
    registration.object.updateWorldMatrix(true, true);
  }

  raycaster.ray.copy(ray);
  raycaster.near = 0;
  raycaster.far = Infinity;

  const intersections = raycaster.intersectObjects(
    registrations.map((registration) => registration.object),
    true,
  );

  for (const intersection of intersections) {
    const registration = findRegistration(registrations, intersection.object);
    if (!registration) continue;

    const normal = getWorldNormal(intersection);
    if (!normal) continue;

    const surface = classifySurface(normal);
    if (!surface || !allowedSurfaces.includes(surface)) continue;

    const point = intersection.point.clone().addScaledVector(normal, DECORATION_LIFT);

    return {
      position: {
        x: point.x,
        y: point.y,
        z: point.z,
      },
      placement: {
        surface,
        tierIndex: registration.tierIndex,
        normal: {
          x: normal.x,
          y: normal.y,
          z: normal.z,
        },
      },
    };
  }

  return null;
}

export function applyDecorationTransform(
  group: THREE.Object3D,
  position: DecorationPosition,
  placement: DecorationPlacement | undefined,
  rotation: DecorationRotation,
) {
  const normal = normalizeNormal(placement?.normal);
  const surfaceQuaternion = new THREE.Quaternion().setFromUnitVectors(LOCAL_UP, normal);
  const userQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(
      THREE.MathUtils.degToRad(rotation.x),
      THREE.MathUtils.degToRad(rotation.y),
      THREE.MathUtils.degToRad(rotation.z),
      'XYZ',
    ),
  );

  group.position.set(position.x, position.y, position.z);
  group.quaternion.copy(surfaceQuaternion).multiply(userQuaternion);
}

export function getDefaultDecorationPlacement(): DecorationPlacement {
  return {
    surface: DEFAULT_TOP_PLACEMENT.surface,
    tierIndex: DEFAULT_TOP_PLACEMENT.tierIndex,
    normal: { ...DEFAULT_TOP_PLACEMENT.normal },
  };
}
