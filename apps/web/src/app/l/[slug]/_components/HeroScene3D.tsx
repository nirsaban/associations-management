'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, MeshWobbleMaterial } from '@react-three/drei';
import * as THREE from 'three';

function FloatingTorus({ position, color, speed }: { position: [number, number, number]; color: string; speed: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    ref.current.rotation.x += delta * speed * 0.3;
    ref.current.rotation.y += delta * speed * 0.2;
  });
  return (
    <Float speed={speed} rotationIntensity={0.4} floatIntensity={1.5} floatingRange={[-0.3, 0.3]}>
      <mesh ref={ref} position={position}>
        <torusGeometry args={[1, 0.4, 16, 32]} />
        <MeshDistortMaterial color={color} speed={2} distort={0.2} roughness={0.4} metalness={0.3} transparent opacity={0.7} />
      </mesh>
    </Float>
  );
}

function FloatingSphere({ position, color, scale, speed }: { position: [number, number, number]; color: string; scale: number; speed: number }) {
  return (
    <Float speed={speed} rotationIntensity={0.3} floatIntensity={2} floatingRange={[-0.5, 0.5]}>
      <mesh position={position} scale={scale}>
        <sphereGeometry args={[1, 32, 32]} />
        <MeshWobbleMaterial color={color} factor={0.3} speed={1.5} roughness={0.5} metalness={0.2} transparent opacity={0.5} />
      </mesh>
    </Float>
  );
}

function FloatingIcosahedron({ position, color, speed }: { position: [number, number, number]; color: string; speed: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((_, delta) => {
    ref.current.rotation.x += delta * speed * 0.15;
    ref.current.rotation.z += delta * speed * 0.1;
  });
  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={1.2} floatingRange={[-0.4, 0.4]}>
      <mesh ref={ref} position={position}>
        <icosahedronGeometry args={[1, 0]} />
        <MeshDistortMaterial color={color} speed={3} distort={0.15} roughness={0.3} metalness={0.4} transparent opacity={0.6} wireframe />
      </mesh>
    </Float>
  );
}

function Particles({ count, color }: { count: number; color: string }) {
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
    }
    return pos;
  }, [count]);

  const ref = useRef<THREE.Points>(null!);
  useFrame((_, delta) => {
    ref.current.rotation.y += delta * 0.02;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color={color} transparent opacity={0.4} sizeAttenuation />
    </points>
  );
}

function Scene({ primaryColor, accentColor }: { primaryColor: string; accentColor: string }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <pointLight position={[-5, -5, 5]} intensity={0.4} color={accentColor} />

      <FloatingTorus position={[-3.5, 1.5, -2]} color={primaryColor} speed={1.2} />
      <FloatingSphere position={[3, -1, -3]} color={accentColor} scale={0.8} speed={1.5} />
      <FloatingSphere position={[-2, -2, -1]} color={primaryColor} scale={0.5} speed={2} />
      <FloatingIcosahedron position={[4, 2, -2]} color={accentColor} speed={0.8} />
      <FloatingSphere position={[0, 3, -4]} color={primaryColor} scale={0.6} speed={1.8} />
      <FloatingTorus position={[5, -2, -3]} color={primaryColor} speed={1} />

      <Particles count={120} color={primaryColor} />
    </>
  );
}

export function HeroScene3D({ primaryColor = '#004650', accentColor = '#B8893A' }: { primaryColor?: string; accentColor?: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene primaryColor={primaryColor} accentColor={accentColor} />
      </Canvas>
    </div>
  );
}
