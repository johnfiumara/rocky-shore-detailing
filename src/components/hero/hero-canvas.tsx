"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import ChromeParticles from "./chrome-particles";

function StaticFallback() {
  return (
    <div
      aria-hidden
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(60% 70% at 70% 30%, rgba(201,163,107,0.22), transparent 60%), radial-gradient(50% 60% at 30% 80%, rgba(60,122,137,0.18), transparent 60%), #0a0b0d",
      }}
    />
  );
}

export default function HeroCanvas() {
  return (
    <div aria-hidden className="absolute inset-0">
      <Suspense fallback={<StaticFallback />}>
        <Canvas
          dpr={[1, 1.75]}
          gl={{ antialias: true, powerPreference: "high-performance" }}
          style={{ background: "#0a0b0d" }}
        >
          <color attach="background" args={["#0a0b0d"]} />
          <PerspectiveCamera makeDefault position={[0, 0, 6]} fov={55} />
          <ambientLight intensity={0.45} />
          <directionalLight position={[5, 4, 5]} intensity={1.1} color="#e9c894" />
          <directionalLight position={[-4, -2, -3]} intensity={0.5} color="#3c7a89" />
          <ChromeParticles />
        </Canvas>
      </Suspense>
    </div>
  );
}
