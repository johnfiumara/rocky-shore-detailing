"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const COUNT = 800;

export default function ChromeParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const particles = useMemo(() => {
    const arr: { pos: THREE.Vector3; speed: number; offset: number; scale: number }[] = [];
    for (let i = 0; i < COUNT; i++) {
      arr.push({
        pos: new THREE.Vector3(
          (Math.random() - 0.5) * 18,
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 12,
        ),
        speed: 0.04 + Math.random() * 0.08,
        offset: Math.random() * Math.PI * 2,
        scale: 0.018 + Math.random() * 0.04,
      });
    }
    return arr;
  }, []);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < COUNT; i++) {
      const p = particles[i];
      const y = p.pos.y + Math.sin(t * p.speed + p.offset) * 0.4;
      const x = p.pos.x + Math.cos(t * p.speed * 0.6 + p.offset) * 0.25;
      dummy.position.set(x, y, p.pos.z);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 12, 12]} />
      <meshStandardMaterial
        color="#e9c894"
        metalness={1}
        roughness={0.25}
        emissive="#c9a36b"
        emissiveIntensity={0.18}
      />
    </instancedMesh>
  );
}
