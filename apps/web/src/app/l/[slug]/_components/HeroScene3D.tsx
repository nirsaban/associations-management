'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

function MorphingSphere({ color, accent }: { color: string; accent: string }) {
  const mesh = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<{ distort: number }>(null!);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    mesh.current.rotation.x = Math.sin(t * 0.3) * 0.2;
    mesh.current.rotation.y = t * 0.15;
    mesh.current.position.y = Math.sin(t * 0.5) * 0.15;
    if (materialRef.current) {
      materialRef.current.distort = 0.35 + Math.sin(t * 0.8) * 0.15;
    }
  });

  return (
    <mesh ref={mesh} scale={2.2}>
      <icosahedronGeometry args={[1, 64]} />
      <MeshDistortMaterial
        ref={materialRef as never}
        color={color}
        envMapIntensity={1.2}
        roughness={0.15}
        metalness={0.9}
        distort={0.4}
        speed={2.5}
      />
    </mesh>
  );
}

function GlowRing({ color, radius, speed }: { color: string; radius: number; speed: number }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    ref.current.rotation.x = Math.PI / 2 + Math.sin(t * speed * 0.5) * 0.3;
    ref.current.rotation.z = t * speed;
  });
  return (
    <mesh ref={ref}>
      <torusGeometry args={[radius, 0.02, 16, 100]} />
      <meshBasicMaterial color={color} transparent opacity={0.4} />
    </mesh>
  );
}

function Dots({ count, color }: { count: number; color: string }) {
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 3 + Math.random() * 2;
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  const ref = useRef<THREE.Points>(null!);
  useFrame(({ clock }) => {
    ref.current.rotation.y = clock.getElapsedTime() * 0.03;
    ref.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.05) * 0.1;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.03} color={color} transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

function Scene({ primaryColor, accentColor }: { primaryColor: string; accentColor: string }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
      <pointLight position={[-4, 3, 2]} intensity={0.8} color={accentColor} />
      <pointLight position={[4, -3, -2]} intensity={0.5} color={primaryColor} />
      <spotLight position={[0, 8, 0]} intensity={0.6} angle={0.5} penumbra={1} color="#ffffff" />

      <MorphingSphere color={primaryColor} accent={accentColor} />

      <GlowRing color={accentColor} radius={3} speed={0.3} />
      <GlowRing color={primaryColor} radius={3.5} speed={-0.2} />
      <GlowRing color={accentColor} radius={4} speed={0.15} />

      <Dots count={200} color={accentColor} />

      <ContactShadows position={[0, -2.5, 0]} opacity={0.3} scale={8} blur={2.5} far={4} />
      <Environment preset="city" />
    </>
  );
}

export function HeroScene3D({ primaryColor = '#004650', accentColor = '#B8893A' }: { primaryColor?: string; accentColor?: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 40 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
      >
        <Scene primaryColor={primaryColor} accentColor={accentColor} />
      </Canvas>
    </div>
  );
}
