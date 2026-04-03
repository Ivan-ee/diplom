'use client';

import { useRef, useState } from 'react';
import { Html } from '@react-three/drei';
import { useSpring, animated } from '@react-spring/three';
import type { PlacedDecoration } from '@/stores/constructor-store';
import { useConstructorStore } from '@/stores/constructor-store';

const CATEGORY_COLORS: Record<string, string> = {
  'Ягоды': '#e05c6e',
  'Шоколад': '#5c3d2e',
  'Топперы': '#c4a08a',
  'Цветы': '#f4b8c8',
  'Фигурки': '#a8d8ea',
};

interface Props {
  decoration: PlacedDecoration;
}

export function DecorationInstance({ decoration }: Props) {
  const removeDecoration = useConstructorStore((s) => s.removeDecoration);
  const ingredients = useConstructorStore((s) => s.ingredients);
  const [hovered, setHovered] = useState(false);

  const decorInfo = ingredients?.decorations.find(
    (d) => d.id === decoration.decorationId
  );
  const color = CATEGORY_COLORS[decorInfo?.category ?? ''] ?? '#c4a08a';

  const { scale } = useSpring({
    scale: hovered ? 1.25 : 1.0,
    config: { mass: 1, tension: 300, friction: 18 },
  });

  return (
    <animated.group
      position={decoration.position}
      scale={scale}
      onPointerOver={(e) => { e.stopPropagation(); setHovered(true); }}
      onPointerOut={() => setHovered(false)}
    >
      {/* Main decoration sphere */}
      <mesh castShadow>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.1}
          emissive={hovered ? color : '#000000'}
          emissiveIntensity={hovered ? 0.3 : 0}
        />
      </mesh>

      {/* Specular highlight dot */}
      <mesh position={[0.02, 0.05, 0.06]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#ffffff" roughness={0.05} metalness={0.0} />
      </mesh>

      {/* Delete overlay on hover */}
      {hovered && (
        <Html
          position={[0, 0.2, 0]}
          center
          style={{ pointerEvents: 'auto' }}
          zIndexRange={[100, 0]}
        >
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
        </Html>
      )}
    </animated.group>
  );
}
