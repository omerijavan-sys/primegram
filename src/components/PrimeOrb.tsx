import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

const OrbMesh = ({ intensity }: { intensity: number }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);

  const color = useMemo(() => {
    // Map intensity to hue: blue(210) -> purple(280) -> pink(350)
    const hue = 210 + intensity * 140;
    return new THREE.Color(`hsl(${hue}, 80%, 55%)`);
  }, [intensity]);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.3;
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
      const scale = 1 + Math.sin(clock.getElapsedTime() * 2) * 0.05 * (1 + intensity);
      meshRef.current.scale.setScalar(scale);
    }
    if (materialRef.current) {
      materialRef.current.distort = 0.3 + intensity * 0.4;
      materialRef.current.speed = 2 + intensity * 5;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]}>
      <MeshDistortMaterial
        ref={materialRef}
        color={color}
        emissive={color}
        emissiveIntensity={0.3 + intensity * 0.5}
        roughness={0.1}
        metalness={0.8}
        distort={0.3}
        speed={2}
        transparent
        opacity={0.9}
      />
    </Sphere>
  );
};

const PrimeOrb = ({ intensity = 0 }: { intensity?: number }) => {
  return (
    <div className="w-24 h-24">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }} gl={{ alpha: true }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[5, 5, 5]} intensity={1} color="#3B82F6" />
        <pointLight position={[-5, -5, 5]} intensity={0.5} color="#8B5CF6" />
        <OrbMesh intensity={intensity} />
      </Canvas>
    </div>
  );
};

export default PrimeOrb;
