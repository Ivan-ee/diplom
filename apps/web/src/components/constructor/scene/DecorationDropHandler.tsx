'use client';

/**
 * DecorationDropHandler — lives inside the R3F Canvas.
 *
 * Responsibilities:
 * 1. When placingDecorationId is set, render an invisible "drop zone" cylinder
 *    group that matches the current cake geometry so raycasting works without
 *    touching CakeModel.
 * 2. Show a semi-transparent ghost sphere that follows the pointer on the cake
 *    surface while in placement mode.
 * 3. On pointer-click confirm placement; on right-click / Escape cancel.
 * 4. Disable OrbitControls during active placement so camera doesn't rotate
 *    while the user aims.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';
import { useConstructorStore } from '@/stores/constructor-store';
import type { TierCount } from '@/stores/constructor-store';

// ---- Mirror of CakeModel's tier geometry constants -------------------------
// Keep in sync if CakeModel constants change (but CakeModel is read-only for
// this agent, so these are the ground-truth values from that file).

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

// ---- Ghost sphere component -------------------------------------------------

const GHOST_COLOR = '#e05c6e';

interface GhostProps {
  position: THREE.Vector3;
  visible: boolean;
}

function GhostDecoration({ position, visible }: GhostProps) {
  const { scale } = useSpring({
    scale: visible ? 1.0 : 0.0,
    config: { mass: 1, tension: 320, friction: 20 },
  });

  return (
    <animated.mesh
      position={position}
      scale={scale}
      renderOrder={10}
    >
      <sphereGeometry args={[0.11, 16, 16]} />
      <meshStandardMaterial
        color={GHOST_COLOR}
        transparent
        opacity={0.55}
        depthWrite={false}
        roughness={0.3}
        metalness={0.1}
      />
    </animated.mesh>
  );
}

// ---- PlacementBounceDecor --------------------------------------------------
// Shown briefly at the confirmed placement position to give a "pop" feedback.

interface BounceProps {
  position: THREE.Vector3;
  color: string;
  onDone: () => void;
}

function PlacementBounce({ position, color, onDone }: BounceProps) {
  const { scale } = useSpring({
    from: { scale: 1.4 },
    to: { scale: 1.0 },
    config: { mass: 1, tension: 400, friction: 14 },
    onRest: onDone,
  });

  return (
    <animated.mesh position={position} scale={scale}>
      <sphereGeometry args={[0.09, 16, 16]} />
      <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
    </animated.mesh>
  );
}

// ---- Main component ---------------------------------------------------------

const _raycaster = new THREE.Raycaster();
const _pointer = new THREE.Vector2();

export function DecorationDropHandler() {
  const { camera, gl, controls, scene } = useThree();

  const placingDecorationId = useConstructorStore((s) => s.placingDecorationId);
  const setPlacingDecorationId = useConstructorStore((s) => s.setPlacingDecorationId);
  const addDecoration = useConstructorStore((s) => s.addDecoration);
  const tierCount = useConstructorStore((s) => s.tierCount);
  const layers = useConstructorStore((s) => s.layers);
  const ingredients = useConstructorStore((s) => s.ingredients);

  const isPlacing = placingDecorationId !== null;

  // Invisible drop-zone meshes — rebuilt when tier geometry changes
  const dropZoneGroupRef = useRef<THREE.Group>(null);

  // Ghost position tracked via ref to avoid re-renders on every frame
  const ghostPosRef = useRef(new THREE.Vector3(0, -100, 0));
  const [ghostVisible, setGhostVisible] = useState(false);
  const [ghostPos, setGhostPos] = useState(() => new THREE.Vector3(0, -100, 0));

  // Bounce feedback state
  const [bounce, setBounce] = useState<{ position: THREE.Vector3; color: string } | null>(null);

  // Latest pointer NDC coords — updated by DOM listeners
  const pointerNDC = useRef(new THREE.Vector2());

  // ---- Disable OrbitControls during placement --------------------------------
  useEffect(() => {
    if (!controls) return;
    const ctrl = controls as unknown as { enabled: boolean };
    if (isPlacing) {
      ctrl.enabled = false;
    } else {
      ctrl.enabled = true;
    }
    return () => {
      ctrl.enabled = true;
    };
  }, [isPlacing, controls]);

  // ---- ESC key cancels placement -------------------------------------------
  useEffect(() => {
    if (!isPlacing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPlacingDecorationId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isPlacing, setPlacingDecorationId]);

  // ---- Collect drop-zone meshes for raycasting ------------------------------
  const getDropZoneMeshes = useCallback((): THREE.Mesh[] => {
    const group = dropZoneGroupRef.current;
    if (!group) return [];
    const meshes: THREE.Mesh[] = [];
    group.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) meshes.push(obj as THREE.Mesh);
    });
    return meshes;
  }, []);

  // ---- Pointer-move: update ghost position ----------------------------------
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isPlacing) return;
      const rect = gl.domElement.getBoundingClientRect();
      pointerNDC.current.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
    },
    [isPlacing, gl.domElement],
  );

  // ---- Pointer-click: place decoration or cancel (right-click) --------------
  const handlePointerDown = useCallback(
    (e: PointerEvent) => {
      if (!isPlacing) return;

      // Right-click cancels
      if (e.button === 2) {
        setPlacingDecorationId(null);
        setGhostVisible(false);
        return;
      }
      if (e.button !== 0) return;

      // Raycast at current pointer position
      const rect = gl.domElement.getBoundingClientRect();
      _pointer.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      );
      _raycaster.setFromCamera(_pointer, camera);

      const meshes = getDropZoneMeshes();
      const hits = _raycaster.intersectObjects(meshes, false);

      if (hits.length === 0) return;

      const hit = hits[0]!;
      const pos: [number, number, number] = [hit.point.x, hit.point.y, hit.point.z];
      const faceNormal = hit.face?.normal ?? new THREE.Vector3(0, 1, 0);
      // Transform face normal from local to world space
      const worldNormal = faceNormal.clone().transformDirection(hit.object.matrixWorld);
      const normal: [number, number, number] = [worldNormal.x, worldNormal.y, worldNormal.z];

      // Look up decoration color for bounce feedback
      const decorInfo = ingredients?.decorations.find(
        (d) => d.id === placingDecorationId,
      );
      const CATEGORY_COLORS: Record<string, string> = {
        'Ягоды': '#e05c6e',
        'Шоколад': '#5c3d2e',
        'Топперы': '#c4a08a',
        'Цветы': '#f4b8c8',
        'Фигурки': '#a8d8ea',
      };
      const bounceColor =
        CATEGORY_COLORS[decorInfo?.category ?? ''] ?? '#c4a08a';

      addDecoration(placingDecorationId!, pos, normal);

      // Bounce feedback
      setBounce({ position: hit.point.clone(), color: bounceColor });

      // Stay in placement mode so user can keep placing the same decoration
      // (cancel with Escape or right-click when done)
    },
    [isPlacing, camera, gl.domElement, getDropZoneMeshes, addDecoration, placingDecorationId, ingredients, setPlacingDecorationId],
  );

  // ---- Attach/detach DOM listeners on the Canvas element -------------------
  useEffect(() => {
    const canvas = gl.domElement;
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerdown', handlePointerDown);
    // Prevent context menu on right-click so cancel works cleanly
    const preventCtxMenu = (e: MouseEvent) => {
      if (isPlacing) e.preventDefault();
    };
    canvas.addEventListener('contextmenu', preventCtxMenu);
    return () => {
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('contextmenu', preventCtxMenu);
    };
  }, [gl.domElement, handlePointerMove, handlePointerDown, isPlacing]);

  // ---- useFrame: raycast on every frame during placement to move ghost ------
  useFrame(() => {
    if (!isPlacing) {
      if (ghostVisible) setGhostVisible(false);
      return;
    }

    _raycaster.setFromCamera(pointerNDC.current, camera);
    const meshes = getDropZoneMeshes();
    const hits = _raycaster.intersectObjects(meshes, false);

    if (hits.length > 0) {
      const pt = hits[0]!.point;
      ghostPosRef.current.copy(pt);
      // Only call setState when position meaningfully changes to limit re-renders
      if (ghostPos.distanceTo(pt) > 0.005) {
        setGhostPos(pt.clone());
      }
      if (!ghostVisible) setGhostVisible(true);
    } else {
      if (ghostVisible) setGhostVisible(false);
    }
  });

  // ---- Build drop-zone geometry when tier data changes ----------------------
  const tierBounds = computeTierBounds(tierCount, layers);

  if (!isPlacing) {
    return null;
  }

  return (
    <>
      {/* Invisible drop-zone meshes that cover each cake tier */}
      <group ref={dropZoneGroupRef}>
        {tierBounds.map((tier, i) => (
          <mesh
            key={i}
            position={[0, tier.yOffset, 0]}
            visible={false}
          >
            {/* Slightly oversized cylinder to make the target forgiving */}
            <cylinderGeometry args={[tier.radius + 0.05, tier.radius + 0.05, tier.height + 0.1, 48, 1]} />
            <meshBasicMaterial side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>

      {/* Ghost decoration that follows the pointer */}
      <GhostDecoration position={ghostPos} visible={ghostVisible} />

      {/* Placement bounce feedback */}
      {bounce && (
        <PlacementBounce
          position={bounce.position}
          color={bounce.color}
          onDone={() => setBounce(null)}
        />
      )}
    </>
  );
}
