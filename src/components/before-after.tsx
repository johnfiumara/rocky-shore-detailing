"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { BeforeAfterPair } from "@/data/gallery";

export default function BeforeAfter({ pair }: { pair: BeforeAfterPair }) {
  const [pos, setPos] = useState(50);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dragging = useRef(false);

  const setFromClientX = (clientX: number) => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = ((clientX - rect.left) / rect.width) * 100;
    setPos(Math.max(0, Math.min(100, ratio)));
  };

  return (
    <div
      ref={wrapRef}
      className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden border border-line select-none cursor-ew-resize"
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        setFromClientX(e.clientX);
      }}
      onPointerMove={(e) => {
        if (dragging.current) setFromClientX(e.clientX);
      }}
      onPointerUp={(e) => {
        dragging.current = false;
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      }}
      role="slider"
      aria-label={`Before and after slider: ${pair.label}. Use arrow keys or drag to compare.`}
      aria-valuenow={Math.round(pos)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") setPos((p) => Math.max(0, p - 4));
        if (e.key === "ArrowRight") setPos((p) => Math.min(100, p + 4));
      }}
    >
      <Image
        src={pair.after.src}
        alt={pair.after.alt}
        fill
        sizes="(min-width: 768px) 75vw, 100vw"
        className="object-cover"
        priority={false}
      />
      <div
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${pos}%` }}
      >
        <Image
          src={pair.before.src}
          alt={pair.before.alt}
          fill
          sizes="(min-width: 768px) 75vw, 100vw"
          className="object-cover"
        />
      </div>
      <div
        className="absolute inset-y-0"
        style={{ left: `${pos}%`, transform: "translateX(-1px)" }}
      >
        <div className="absolute inset-y-0 w-px bg-bone" />
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-12 rounded-full bg-bone text-ink flex items-center justify-center shadow-2xl pointer-events-none">
          <span className="text-xs font-mono-accent tracking-wider">‹ ›</span>
        </div>
      </div>
      <div className="absolute top-4 left-4 font-mono-accent text-[10px] tracking-[0.2em] uppercase bg-ink/70 backdrop-blur px-3 py-1.5 rounded-full text-bone">
        Before
      </div>
      <div className="absolute top-4 right-4 font-mono-accent text-[10px] tracking-[0.2em] uppercase bg-ink/70 backdrop-blur px-3 py-1.5 rounded-full text-bronze">
        After
      </div>
    </div>
  );
}
