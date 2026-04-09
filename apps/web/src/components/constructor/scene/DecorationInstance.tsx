'use client';

/**
 * DecorationInstance — renders a single placed decoration sphere.
 *
 * Drag-to-reposition:
 * - onPointerDown on the mesh starts drag mode.
 * - While dragging, OrbitControls is disabled (via useThree controls).
 * - Raycasting on pointermove finds the new position on the cake surface using
 *   invisible drop-zone cylinders (same geometry as DecorationDropHandler).
 * - onPointerUp finalises the position via moveDecoration and re-enables
 *   OrbitControls.
 *
 * Hover tooltip with "Удалить" button is hidden during drag.
 *
 * Each decoration category renders a distinct procedural 3D shape via
 * DecorationGeometry. All geometry is created in useMemo to avoid recreation
 * on every render. Overall bounding radius stays within 0.09–0.12.
 */

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import type { PlacedDecoration, TierCount } from '@/stores/constructor-store';
import { useConstructorStore } from '@/stores/constructor-store';

// ---- Mirror tier-geometry constants (same as DecorationDropHandler) --------

const TIER_RADII: Record<number, number[]> = {
  1: [1.3],
  2: [1.3, 0.95],
  3: [1.3, 0.95, 0.65],
};

interface TierBounds {
  radius: number;
  height: number;
  yOffset: number;
}

function computeTierBounds(
  tierCount: TierCount,
  layers: Array<{ weight: number }>,
): TierBounds[] {
  const radii = TIER_RADII[tierCount] ?? [1.3];
  const data: TierBounds[] = [];
  let cumulativeY = 0;

  for (let i = 0; i < tierCount; i++) {
    const weightG = layers[i]?.weight ?? 1000;
    const height = Math.max(0.4, Math.min(2.0, weightG / 1500));
    const radius = radii[i] ?? 1.3;

    if (i === 0) {
      cumulativeY = height / 2;
    } else {
      const prev = data[i - 1]!;
      cumulativeY = prev.yOffset + prev.height / 2 + height / 2 + 0.04;
    }

    data.push({ radius, height, yOffset: cumulativeY });
  }
  return data;
}

// ---- Category colour map ---------------------------------------------------

const CATEGORY_COLORS: Record<string, string> = {
  'Ягоды': '#e05c6e',
  'Шоколад': '#5c3d2e',
  'Топперы': '#c4a08a',
  'Цветы': '#f4b8c8',
  'Фигурки': '#a8d8ea',
};

// ---- Category-specific geometry components ---------------------------------

/**
 * Berry: a slightly elongated sphere with 3 tiny seed-dot children and a
 * small green leaf cone on top. Overall radius stays ~0.09.
 */
function BerryMesh({ color, hovered, isDragging }: { color: string; hovered: boolean; isDragging: boolean }) {
  const seedOffsets = useMemo<[number, number, number][]>(
    () => [
      [0.045, 0.03, 0.055],
      [-0.04, -0.01, 0.06],
      [0.01, -0.05, 0.055],
    ],
    [],
  );

  return (
    <group scale={[1, 1.15, 1]}>
      {/* Main berry body */}
      <mesh castShadow>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial
          color={color}
          roughness={0.45}
          metalness={0.05}
          emissive={hovered && !isDragging ? color : '#000000'}
          emissiveIntensity={hovered && !isDragging ? 0.3 : 0}
        />
      </mesh>

      {/* Seed dots */}
      {seedOffsets.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.014, 6, 6]} />
          <meshStandardMaterial color="#c0394a" roughness={0.6} metalness={0.0} />
        </mesh>
      ))}

      {/* Leaf cone on top */}
      <mesh position={[0, 0.095, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.025, 0.055, 5]} />
        <meshStandardMaterial color="#3a8a3a" roughness={0.7} metalness={0.0} />
      </mesh>
    </group>
  );
}

/**
 * Chocolate: a small rounded box — BoxGeometry with high bevel feel via
 * extra segments and a dark-brown glossy material.
 */
function ChocolateMesh({ color, hovered, isDragging }: { color: string; hovered: boolean; isDragging: boolean }) {
  return (
    <mesh castShadow rotation={[0.2, 0.4, 0.1]}>
      <boxGeometry args={[0.16, 0.1, 0.16, 2, 2, 2]} />
      <meshStandardMaterial
        color={color}
        roughness={0.15}
        metalness={0.25}
        emissive={hovered && !isDragging ? color : '#000000'}
        emissiveIntensity={hovered && !isDragging ? 0.25 : 0}
      />
    </mesh>
  );
}

/**
 * Topper: a thin stick (CylinderGeometry) with a flat banner (BoxGeometry)
 * on top. Gold-ish colour.
 */
function TopperMesh({ color, hovered, isDragging }: { color: string; hovered: boolean; isDragging: boolean }) {
  const goldColor = '#c8a84b';
  const emissiveColor = hovered && !isDragging ? goldColor : '#000000';
  const emissiveInt = hovered && !isDragging ? 0.3 : 0;

  return (
    <group>
      {/* Stick */}
      <mesh castShadow position={[0, -0.01, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.18, 8]} />
        <meshStandardMaterial
          color={goldColor}
          roughness={0.3}
          metalness={0.6}
          emissive={emissiveColor}
          emissiveIntensity={emissiveInt}
        />
      </mesh>

      {/* Flag / banner */}
      <mesh castShadow position={[0.04, 0.1, 0]}>
        <boxGeometry args={[0.1, 0.07, 0.012]} />
        <meshStandardMaterial
          color={color}
          roughness={0.4}
          metalness={0.3}
          emissive={emissiveColor}
          emissiveIntensity={emissiveInt}
        />
      </mesh>
    </group>
  );
}

/**
 * Flower: a centre sphere surrounded by 5 petal ellipsoids arranged in a
 * circle. Pink palette.
 */
function FlowerMesh({ color, hovered, isDragging }: { color: string; hovered: boolean; isDragging: boolean }) {
  const PETAL_COUNT = 5;
  const petalData = useMemo(
    () =>
      Array.from({ length: PETAL_COUNT }, (_, i) => {
        const angle = (i / PETAL_COUNT) * Math.PI * 2;
        return {
          pos: [Math.cos(angle) * 0.072, Math.sin(angle) * 0.072, 0] as [number, number, number],
          rot: [0, 0, angle] as [number, number, number],
        };
      }),
    [],
  );

  const emissiveColor = hovered && !isDragging ? color : '#000000';
  const emissiveInt = hovered && !isDragging ? 0.3 : 0;

  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {/* Centre */}
      <mesh castShadow>
        <sphereGeometry args={[0.032, 10, 10]} />
        <meshStandardMaterial
          color="#f7d06e"
          roughness={0.5}
          metalness={0.05}
          emissive={emissiveColor}
          emissiveIntensity={emissiveInt}
        />
      </mesh>

      {/* Petals */}
      {petalData.map(({ pos, rot }, i) => (
        <mesh key={i} position={pos} rotation={rot} castShadow scale={[1, 2.2, 0.6]}>
          <sphereGeometry args={[0.036, 8, 8]} />
          <meshStandardMaterial
            color={color}
            roughness={0.55}
            metalness={0.0}
            emissive={emissiveColor}
            emissiveIntensity={emissiveInt}
          />
        </mesh>
      ))}
    </group>
  );
}

/**
 * Figure: an icosahedron with a subtle blue tint — reads as a gem/crystal
 * figurine at decoration scale.
 */
function FigureMesh({ color, hovered, isDragging }: { color: string; hovered: boolean; isDragging: boolean }) {
  return (
    <mesh castShadow rotation={[0.3, 0.6, 0.2]}>
      <icosahedronGeometry args={[0.092, 0]} />
      <meshStandardMaterial
        color={color}
        roughness={0.1}
        metalness={0.4}
        emissive={hovered && !isDragging ? color : '#000000'}
        emissiveIntensity={hovered && !isDragging ? 0.35 : 0}
      />
    </mesh>
  );
}

/** Fallback: plain sphere used when category is unrecognised. */
function DefaultSphereMesh({ color, hovered, isDragging }: { color: string; hovered: boolean; isDragging: boolean }) {
  return (
    <mesh castShadow>
      <sphereGeometry args={[0.09, 16, 16]} />
      <meshStandardMaterial
        color={color}
        roughness={0.3}
        metalness={0.1}
        emissive={hovered && !isDragging ? color : '#000000'}
        emissiveIntensity={hovered && !isDragging ? 0.3 : 0}
      />
    </mesh>
  );
}

interface DecorationGeometryProps {
  category: string;
  color: string;
  hovered: boolean;
  isDragging: boolean;
}

function DecorationGeometry({ category, color, hovered, isDragging }: DecorationGeometryProps) {
  switch (category) {
    case 'Ягоды':
      return <BerryMesh color={color} hovered={hovered} isDragging={isDragging} />;
    case 'Шоколад':
      return <ChocolateMesh color={color} hovered={hovered} isDragging={isDragging} />;
    case 'Топперы':
      return <TopperMesh color={color} hovered={hovered} isDragging={isDragging} />;
    case 'Цветы':
      return <FlowerMesh color={color} hovered={hovered} isDragging={isDragging} />;
    case 'Фигурки':
      return <FigureMesh color={color} hovered={hovered} isDragging={isDragging} />;
    default:
      return <DefaultSphereMesh color={color} hovered={hovered} isDragging={isDragging} />;
  }
}

// ---- Shared raycaster (one instance, not recreated per component) ----------

const _raycaster = new THREE.Raycaster();
const _pointer = new THREE.Vector2();

// ---- Component -------------------------------------------------------------

interface Props {
  decoration: PlacedDecoration;
}

export function DecorationInstance({ decoration }: Props) {
  const { camera, gl, controls, scene } = useThree();

  const removeDecoration = useConstructorStore((s) => s.removeDecoration);
  const moveDecoration = useConstructorStore((s) => s.moveDecoration);
  const ingredients = useConstructorStore((s) => s.ingredients);
  const tierCount = useConstructorStore((s) => s.tierCount);
  const layers = useConstructorStore((s) => s.layers);

  const [hovered, setHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Current live position during drag — stored in a ref to avoid per-frame
  // state updates; synced to state only on pointerUp.
  const dragPosRef = useRef<THREE.Vector3 | null>(null);
  const [livePos, setLivePos] = useState<[number, number, number]>(decoration.position);

  // Keep livePos in sync when the store position changes from outside (e.g.
  // initial load) but NOT while we are mid-drag.
  const draggingRef = useRef(false);
  useEffect(() => {
    if (!draggingRef.current) {
      setLivePos(decoration.position);
    }
  }, [decoration.position]);

  // Invisible drop-zone meshes built in scene (not rendered) — we create them
  // imperatively so they exist only during drag without entering React state.
  const dropZoneGroupRef = useRef<THREE.Group | null>(null);

  const buildDropZones = useCallback(() => {
    const tierBounds = computeTierBounds(tierCount, layers);
    const group = new THREE.Group();
    for (const tier of tierBounds) {
      const geo = new THREE.CylinderGeometry(
        tier.radius + 0.05,
        tier.radius + 0.05,
        tier.height + 0.1,
        48,
        1,
      );
      const mat = new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(0, tier.yOffset, 0);
      group.add(mesh);
    }
    return group;
  }, [tierCount, layers]);

  // ---- Spring: hover scale, drag lift ----------------------------------------
  const decorInfo = ingredients?.decorations.find(
    (d) => d.id === decoration.decorationId,
  );
  const color = CATEGORY_COLORS[decorInfo?.category ?? ''] ?? '#c4a08a';

  const { scale } = useSpring({
    scale: isDragging ? 1.4 : hovered ? 1.25 : 1.0,
    config: { mass: 1, tension: 300, friction: 18 },
  });

  // ---- Drag start -----------------------------------------------------------
  const handlePointerDown = useCallback(
    (e: { nativeEvent: PointerEvent; stopPropagation: () => void }) => {
      e.stopPropagation();
      if (e.nativeEvent.button !== 0) return;

      draggingRef.current = true;
      setIsDragging(true);
      setHovered(false);

      // Disable orbit controls
      const ctrl = controls as unknown as { enabled: boolean } | null;
      if (ctrl) ctrl.enabled = false;

      // Build and inject drop-zone group directly into the R3F scene
      const group = buildDropZones();
      dropZoneGroupRef.current = group;
      scene.add(group);

      // Capture pointer on canvas so we keep getting events outside the mesh
      gl.domElement.setPointerCapture(e.nativeEvent.pointerId);
    },
    [controls, scene, gl.domElement, buildDropZones],
  );

  // ---- Pointer move during drag (DOM listener on canvas) --------------------
  const handleCanvasPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!draggingRef.current) return;

      const rect = gl.domElement.getBoundingClientRect();
      _pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      _raycaster.setFromCamera(_pointer, camera);

      const group = dropZoneGroupRef.current;
      if (!group) return;

      const meshes: THREE.Mesh[] = [];
      group.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) meshes.push(obj as THREE.Mesh);
      });

      const hits = _raycaster.intersectObjects(meshes, false);
      if (hits.length > 0) {
        const pt = hits[0]!.point;
        dragPosRef.current = pt.clone();
        setLivePos([pt.x, pt.y, pt.z]);
      }
    },
    [camera, gl.domElement],
  );

  // ---- Pointer up: finalise position ----------------------------------------
  const handleCanvasPointerUp = useCallback(
    (e: PointerEvent) => {
      if (!draggingRef.current) return;

      draggingRef.current = false;
      setIsDragging(false);

      // Re-enable orbit controls
      const ctrl = controls as unknown as { enabled: boolean } | null;
      if (ctrl) ctrl.enabled = true;

      // Remove drop-zone group from scene
      const group = dropZoneGroupRef.current;
      if (group) {
        group.parent?.remove(group);
        group.traverse((obj) => {
          const mesh = obj as THREE.Mesh;
          if (mesh.isMesh) {
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((m) => m.dispose());
            } else {
              mesh.material.dispose();
            }
          }
        });
        dropZoneGroupRef.current = null;
      }

      // Commit position to store
      if (dragPosRef.current) {
        const pt = dragPosRef.current;
        moveDecoration(decoration.id, [pt.x, pt.y, pt.z], [0, 1, 0]);
        dragPosRef.current = null;
      }

      gl.domElement.releasePointerCapture(e.pointerId);
    },
    [controls, decoration.id, moveDecoration, gl.domElement],
  );

  // Attach/detach canvas-level listeners
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointermove', handleCanvasPointerMove);
    canvas.addEventListener('pointerup', handleCanvasPointerUp);
    return () => {
      canvas.removeEventListener('pointermove', handleCanvasPointerMove);
      canvas.removeEventListener('pointerup', handleCanvasPointerUp);
    };
  }, [gl.domElement, handleCanvasPointerMove, handleCanvasPointerUp]);

  // Clean up drop-zone group on unmount if drag was interrupted
  useEffect(() => {
    return () => {
      const group = dropZoneGroupRef.current;
      if (group) {
        group.parent?.remove(group);
        dropZoneGroupRef.current = null;
      }
    };
  }, []);

  return (
    <animated.group
      position={livePos}
      scale={scale}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (!isDragging) setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onPointerDown={handlePointerDown}
    >
      <DecorationGeometry
        category={decorInfo?.category ?? ''}
        color={color}
        hovered={hovered}
        isDragging={isDragging}
      />

      {/* Drag handle hint ring — shown only when hovered and not dragging */}
      {hovered && !isDragging && (
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.13, 0.008, 8, 32]} />
          <meshStandardMaterial color={color} roughness={0.4} metalness={0.0} transparent opacity={0.6} />
        </mesh>
      )}

      {/* Tooltip — hidden during drag */}
      {hovered && !isDragging && (
        <Html
          position={[0, 0.22, 0]}
          center
          style={{ pointerEvents: 'auto' }}
          zIndexRange={[100, 0]}
        >
          <div
            style={{
              display: 'flex',
              gap: '4px',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                background: 'rgba(45,45,45,0.7)',
                backdropFilter: 'blur(4px)',
                color: 'rgba(255,255,255,0.7)',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '10px',
                fontFamily: 'Open Sans, sans-serif',
                whiteSpace: 'nowrap',
              }}
            >
              Тяните чтобы переместить
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                removeDecoration(decoration.id);
              }}
              style={{
                background: 'rgba(45, 45, 45, 0.85)',
                backdropFilter: 'blur(4px)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '11px',
                fontFamily: 'Open Sans, sans-serif',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  'rgba(196, 160, 138, 0.95)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.background =
                  'rgba(45, 45, 45, 0.85)')
              }
            >
              Удалить
            </button>
          </div>
        </Html>
      )}
    </animated.group>
  );
}
