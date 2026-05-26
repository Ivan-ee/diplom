'use client';

export function LightingRig() {
  return (
    <>
      <ambientLight color="#fffaf0" intensity={0.55} />

      <hemisphereLight args={['#fff7ed', '#8b735c', 1.15]} />

      {/* Key light: upper right front */}
      <directionalLight
        position={[4.5, 7, 4.5]}
        color="#fff8ed"
        intensity={2.4}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.1}
        shadow-camera-far={30}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />

      {/* Fill light: soft front-left balance */}
      <directionalLight position={[-5, 4, 4]} intensity={1.15} color="#eaf3ff" />

      {/* Rim light: separates dark cake sides from the background */}
      <directionalLight position={[-3, 5, -5]} intensity={0.75} color="#fff1d6" />

      {/* Top lift: keeps coating and decor readable from orbit/top views */}
      <directionalLight position={[0, 6, 0]} intensity={0.45} color="#fffaf0" />
    </>
  );
}
