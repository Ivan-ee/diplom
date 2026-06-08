'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Clone, Html, Outlines, useGLTF } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { CakeShape } from '@/lib/constructor/model-registry';
import { getSelectionOutlineThickness } from './decoration-outline';
import {
  getCandleModelPath,
  getDecorationAllowedSurfaces,
  getDecorationReplacementGroup,
  getDecoModelPath,
} from '@/lib/constructor/model-registry';
import {
  useConstructorStore,
  type DecorationPlacement,
  type DecorationPosition,
  type DecorationRotation,
} from '@/stores/constructor-store';
import { useDecorationScene } from './DecorationSceneContext';
import {
  applyDecorationTransform,
  findDecorationSurfacePlacement,
  getDefaultDecorationPlacement,
} from './decoration-placement';

interface GlbDecorationProps {
  instanceId: string;
  shape: CakeShape;
  decorVariant: string;
  position: DecorationPosition;
  placement?: DecorationPlacement;
  orientation: DecorationRotation;
}

type RotationAxis = keyof DecorationRotation;
type RotationDirection = -1 | 1;

const ROTATION_SPEED_DEG_PER_SECOND = 150;

interface PointerCaptureTarget {
  setPointerCapture?: (pointerId: number) => void;
  releasePointerCapture?: (pointerId: number) => void;
  hasPointerCapture?: (pointerId: number) => boolean;
}

const calculateFixedHudPosition = (
  _object: THREE.Object3D,
  _camera: THREE.Camera,
  size: { width: number; height: number },
) => [size.width / 2, size.height / 2];

function normalizeDegrees(value: number): number {
  const next = value % 360;
  return next < 0 ? next + 360 : next;
}

function releasePointerCaptureSafely(
  target: PointerCaptureTarget | null,
  pointerId: number | null,
) {
  if (!target || pointerId === null || !target.releasePointerCapture) return;

  try {
    if (!target.hasPointerCapture || target.hasPointerCapture(pointerId)) {
      target.releasePointerCapture(pointerId);
    }
  } catch {
    // Pointer capture is intentionally best-effort: browsers can clear it
    // before React receives pointerup/cancel/lostpointercapture cleanup.
  }
}

function setPointerCaptureSafely(
  target: PointerCaptureTarget | null,
  pointerId: number | null,
) {
  if (!target || pointerId === null || !target.setPointerCapture) return;

  try {
    target.setPointerCapture(pointerId);
  } catch {
    // Synthetic browser events and already-cancelled pointers can reach here.
    // Drag still works through window-level pointerup/pointercancel cleanup.
  }
}

function DecoModel({
  instanceId,
  decorVariant,
  url,
  position,
  placement,
  orientation,
}: {
  instanceId: string;
  decorVariant: string;
  url: string;
  position: DecorationPosition;
  placement?: DecorationPlacement;
  orientation: DecorationRotation;
}) {
  const gltf = useGLTF(url);
  const moveDecorationInstance = useConstructorStore((s) => s.moveDecorationInstance);
  const rotateDecorationInstance = useConstructorStore((s) => s.rotateDecorationInstance);
  const selectDecorationInstance = useConstructorStore((s) => s.selectDecorationInstance);
  const duplicateDecorationInstance = useConstructorStore((s) => s.duplicateDecorationInstance);
  const removeDecorationInstance = useConstructorStore((s) => s.removeDecorationInstance);
  const selectedDecorationInstanceId = useConstructorStore((s) => s.selectedDecorationInstanceId);
  const { raycaster } = useThree();
  const {
    beginDecorationDrag,
    endDecorationDrag,
    getTierSurfaces,
  } = useDecorationScene();
  const groupRef = useRef<THREE.Group>(null);
  const allowedSurfaces = useMemo(() => getDecorationAllowedSurfaces(decorVariant), [decorVariant]);
  const isSingletonDecoration = useMemo(
    () => Boolean(getDecorationReplacementGroup(decorVariant)),
    [decorVariant],
  );
  const isDraggingRef = useRef(false);
  const dragPositionRef = useRef<DecorationPosition>(position);
  const dragPlacementRef = useRef<DecorationPlacement | undefined>(placement ?? getDefaultDecorationPlacement());
  const dragPointerIdRef = useRef<number | null>(null);
  const dragTargetRef = useRef<PointerCaptureTarget | null>(null);
  const rotationRef = useRef<DecorationRotation>(orientation);
  const rotatingRef = useRef<{ axis: RotationAxis; direction: RotationDirection } | null>(null);
  const rotateButtonRef = useRef<HTMLButtonElement | null>(null);
  const rotationPointerIdRef = useRef<number | null>(null);
  const rotationLockActiveRef = useRef(false);
  const stopRotatingRef = useRef<() => void>(() => undefined);
  const stopDraggingRef = useRef<(commit: boolean) => void>(() => undefined);
  const [activeAxis, setActiveAxis] = useState<RotationAxis>('y');
  const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const { bottomOffset, outlineThickness } = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    const size = box.getSize(new THREE.Vector3());
    const maxModelSize = Math.max(size.x, size.y, size.z);

    return {
      bottomOffset: Number.isFinite(box.min.y) ? -box.min.y : 0,
      outlineThickness: getSelectionOutlineThickness(maxModelSize),
    };
  }, [clonedScene]);
  const isSelected = selectedDecorationInstanceId === instanceId;
  const outlineInjector = useCallback(
    (object: THREE.Object3D) => {
      if (!isSelected || !(object instanceof THREE.Mesh)) return null;

      return (
        <Outlines
          color="#f4a340"
          transparent
          opacity={0.95}
          toneMapped={false}
          thickness={outlineThickness}
          screenspace
          renderOrder={999}
        />
      );
    },
    [isSelected, outlineThickness],
  );

  useEffect(() => {
    rotationRef.current = orientation;
    dragPositionRef.current = position;
    dragPlacementRef.current = placement ?? getDefaultDecorationPlacement();
    if (!groupRef.current || rotatingRef.current || isDraggingRef.current) return;
    applyDecorationTransform(
      groupRef.current,
      dragPositionRef.current,
      dragPlacementRef.current,
      rotationRef.current,
    );
  }, [orientation, placement, position]);

  const stopDraggingFromWindow = useCallback(() => {
    stopDraggingRef.current(true);
  }, []);

  const cancelDraggingFromWindow = useCallback(() => {
    stopDraggingRef.current(false);
  }, []);

  const stopDragging = useCallback((commit: boolean) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    window.removeEventListener('pointerup', stopDraggingFromWindow, true);
    window.removeEventListener('pointercancel', cancelDraggingFromWindow, true);
    window.removeEventListener('blur', cancelDraggingFromWindow);

    const captureTarget = dragTargetRef.current;
    const pointerId = dragPointerIdRef.current;
    releasePointerCaptureSafely(captureTarget, pointerId);

    dragTargetRef.current = null;
    dragPointerIdRef.current = null;
    endDecorationDrag();

    if (commit) {
      moveDecorationInstance(instanceId, dragPositionRef.current, dragPlacementRef.current);
    }
  }, [
    cancelDraggingFromWindow,
    endDecorationDrag,
    instanceId,
    moveDecorationInstance,
    stopDraggingFromWindow,
  ]);

  useEffect(() => {
    stopDraggingRef.current = stopDragging;
  }, [stopDragging]);

  const stopRotatingFromWindow = useCallback(() => {
    stopRotatingRef.current();
  }, []);

  const stopRotating = useCallback(() => {
    const wasRotating = rotatingRef.current;
    rotatingRef.current = null;

    window.removeEventListener('pointerup', stopRotatingFromWindow, true);
    window.removeEventListener('pointercancel', stopRotatingFromWindow, true);
    window.removeEventListener('blur', stopRotatingFromWindow);

    const rotateButton = rotateButtonRef.current;
    const pointerId = rotationPointerIdRef.current;
    releasePointerCaptureSafely(rotateButton, pointerId);

    rotateButtonRef.current = null;
    rotationPointerIdRef.current = null;

    if (rotationLockActiveRef.current) {
      rotationLockActiveRef.current = false;
      endDecorationDrag();
    }

    if (wasRotating) {
      rotateDecorationInstance(instanceId, rotationRef.current);
    }
  }, [endDecorationDrag, instanceId, rotateDecorationInstance, stopRotatingFromWindow]);

  useEffect(() => {
    stopRotatingRef.current = stopRotating;
  }, [stopRotating]);

  useEffect(() => () => {
    stopDragging(false);
    stopRotating();
  }, [stopDragging, stopRotating]);

  useFrame((_, delta) => {
    const rotating = rotatingRef.current;
    const group = groupRef.current;
    if (!group) return;

    if (rotating) {
      const nextDegrees = normalizeDegrees(
        rotationRef.current[rotating.axis] +
          rotating.direction * ROTATION_SPEED_DEG_PER_SECOND * delta,
      );
      rotationRef.current = {
        ...rotationRef.current,
        [rotating.axis]: nextDegrees,
      };
      applyDecorationTransform(
        group,
        dragPositionRef.current,
        dragPlacementRef.current,
        rotationRef.current,
      );
    }
  });

  const startRotating = (
    event: ReactPointerEvent<HTMLButtonElement>,
    axis: RotationAxis,
    direction: RotationDirection,
  ) => {
    event.stopPropagation();
    stopRotating();
    setActiveAxis(axis);
    beginDecorationDrag();
    rotationLockActiveRef.current = true;
    rotatingRef.current = { axis, direction };
    rotateButtonRef.current = event.currentTarget;
    rotationPointerIdRef.current = event.pointerId;
    setPointerCaptureSafely(event.currentTarget, event.pointerId);
    window.addEventListener('pointerup', stopRotatingFromWindow, true);
    window.addEventListener('pointercancel', stopRotatingFromWindow, true);
    window.addEventListener('blur', stopRotatingFromWindow);
  };

  const moveToPointer = (event: ThreeEvent<PointerEvent>) => {
    const hit = findDecorationSurfacePlacement(
      event.ray,
      getTierSurfaces(),
      allowedSurfaces,
      raycaster,
    );
    if (!hit || !groupRef.current) return;

    dragPositionRef.current = hit.position;
    dragPlacementRef.current = hit.placement;
    applyDecorationTransform(
      groupRef.current,
      dragPositionRef.current,
      dragPlacementRef.current,
      rotationRef.current,
    );
  };

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      onPointerDown={(event) => {
        event.stopPropagation();
        selectDecorationInstance(instanceId);
        dragPositionRef.current = position;
        dragPlacementRef.current = placement ?? getDefaultDecorationPlacement();
        isDraggingRef.current = true;
        beginDecorationDrag();
        const target = event.target as unknown as PointerCaptureTarget;
        dragTargetRef.current = target;
        dragPointerIdRef.current = event.pointerId;
        setPointerCaptureSafely(target, event.pointerId);
        window.addEventListener('pointerup', stopDraggingFromWindow, true);
        window.addEventListener('pointercancel', cancelDraggingFromWindow, true);
        window.addEventListener('blur', cancelDraggingFromWindow);
      }}
      onPointerMove={(event) => {
        if (!isDraggingRef.current) return;
        event.stopPropagation();
        moveToPointer(event);
      }}
      onPointerUp={(event) => {
        event.stopPropagation();
        stopDragging(true);
      }}
      onPointerCancel={(event) => {
        event.stopPropagation();
        stopDragging(false);
      }}
      onLostPointerCapture={() => stopDragging(true)}
    >
      <Clone object={clonedScene} position={[0, bottomOffset, 0]} inject={outlineInjector} />
      {isSelected && (
        <Html
          fullscreen
          calculatePosition={calculateFixedHudPosition}
          zIndexRange={[40, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="pointer-events-none absolute inset-0">
            <div
              className="pointer-events-auto absolute right-4 top-4 flex min-w-[156px] flex-col gap-2 rounded-2xl border border-[var(--color-caramel)]/30 bg-white/95 p-2 shadow-lg backdrop-blur"
              onPointerDown={(event) => event.stopPropagation()}
              onPointerMove={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onPointerCancel={(event) => event.stopPropagation()}
            >
              <div className="grid grid-cols-3 gap-1">
                {(['x', 'y', 'z'] as RotationAxis[]).map((axis) => (
                  <button
                    key={axis}
                    type="button"
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      setActiveAxis(axis);
                    }}
                    className={`h-7 rounded-full text-[11px] font-bold uppercase transition-colors ${
                      activeAxis === axis
                        ? 'bg-[var(--color-caramel)] text-white'
                        : 'bg-[var(--surface-secondary)] text-[var(--color-graphite-light)]'
                    }`}
                  >
                    {axis}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-[44px_1fr_44px] items-center gap-2">
                <button
                  type="button"
                  aria-label="Повернуть против часовой стрелки"
                  onPointerDown={(event) => {
                    startRotating(event, activeAxis, -1);
                  }}
                  onPointerUp={(event) => {
                    event.stopPropagation();
                    stopRotating();
                  }}
                  onPointerCancel={(event) => {
                    event.stopPropagation();
                    stopRotating();
                  }}
                  onLostPointerCapture={stopRotating}
                  className="grid h-11 w-11 place-items-center rounded-full border border-[var(--color-caramel)]/25 bg-white text-lg font-bold text-[var(--color-caramel)] shadow-sm"
                >
                  ↺
                </button>
                <div className="rounded-xl bg-[var(--color-caramel)]/10 px-2 py-2 text-center text-[11px] font-medium text-[var(--color-caramel)]">
                  удерживать
                  <br />
                  поворот {activeAxis.toUpperCase()}
                </div>
                <button
                  type="button"
                  aria-label="Повернуть по часовой стрелке"
                  onPointerDown={(event) => {
                    startRotating(event, activeAxis, 1);
                  }}
                  onPointerUp={(event) => {
                    event.stopPropagation();
                    stopRotating();
                  }}
                  onPointerCancel={(event) => {
                    event.stopPropagation();
                    stopRotating();
                  }}
                  onLostPointerCapture={stopRotating}
                  className="grid h-11 w-11 place-items-center rounded-full border border-[var(--color-caramel)]/25 bg-white text-lg font-bold text-[var(--color-caramel)] shadow-sm"
                >
                  ↻
                </button>
              </div>
              <div className="grid grid-cols-2 gap-1">
                {!isSingletonDecoration && (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      duplicateDecorationInstance(instanceId);
                    }}
                    className="h-7 rounded-full bg-[var(--surface-secondary)] text-[11px] font-semibold text-[var(--color-graphite)]"
                  >
                    Дубль
                  </button>
                )}
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    removeDecorationInstance(instanceId);
                  }}
                  className={`h-7 rounded-full bg-red-50 text-[11px] font-semibold text-red-700 ${
                    isSingletonDecoration ? 'col-span-2' : ''
                  }`}
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

export function GlbDecoration({
  instanceId,
  shape,
  decorVariant,
  position,
  placement,
  orientation,
}: GlbDecorationProps) {
  const url = getDecoModelPath(shape, decorVariant);
  if (!url) return null;

  return (
    <DecoModel
      instanceId={instanceId}
      decorVariant={decorVariant}
      url={url}
      position={position}
      placement={placement}
      orientation={orientation}
    />
  );
}

interface GlbCandleProps {
  shape: CakeShape;
  yOffset: number;
}

function CandleModel({ url, yOffset }: { url: string; yOffset: number }) {
  const gltf = useGLTF(url);
  const clonedScene = useMemo(() => gltf.scene.clone(true), [gltf.scene]);
  const bottomOffset = useMemo(() => {
    const box = new THREE.Box3().setFromObject(clonedScene);
    return Number.isFinite(box.min.y) ? -box.min.y : 0;
  }, [clonedScene]);

  return (
    <group position={[0, yOffset, 0]}>
      <primitive object={clonedScene} position={[0, bottomOffset, 0]} />
    </group>
  );
}

export function GlbCandle({ shape, yOffset }: GlbCandleProps) {
  const url = getCandleModelPath(shape);

  return <CandleModel url={url} yOffset={yOffset} />;
}
