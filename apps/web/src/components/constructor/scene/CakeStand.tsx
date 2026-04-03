'use client';

import { ContactShadows } from '@react-three/drei';

export function CakeStand() {
  return (
    <>
      {/* Stand plate */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[2.1, 2.3, 0.1, 64]} />
        <meshStandardMaterial
          color="#f0ece6"
          roughness={0.3}
          metalness={0.05}
        />
      </mesh>

      {/* Stand pedestal */}
      <mesh position={[0, -0.25, 0]} receiveShadow>
        <cylinderGeometry args={[0.3, 0.5, 0.3, 32]} />
        <meshStandardMaterial
          color="#e8e0d8"
          roughness={0.4}
          metalness={0.05}
        />
      </mesh>

      {/* Stand base disc */}
      <mesh position={[0, -0.42, 0]} receiveShadow>
        <cylinderGeometry args={[0.8, 0.8, 0.06, 48]} />
        <meshStandardMaterial
          color="#e8e0d8"
          roughness={0.35}
          metalness={0.05}
        />
      </mesh>

      {/* Contact shadow on floor */}
      <ContactShadows
        position={[0, -0.46, 0]}
        opacity={0.4}
        blur={2}
        far={4}
        scale={8}
        color="#8a6a50"
      />
    </>
  );
}
