"use client";

import { useEffect, useRef, useState } from "react";

export default function Cursor() {
  const dotRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const fine = window.matchMedia("(pointer: fine)").matches;
    const noPref = window.matchMedia("(prefers-reduced-motion: no-preference)").matches;
    setEnabled(fine && noPref);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let rx = window.innerWidth / 2;
    let ry = window.innerHeight / 2;
    let tx = rx;
    let ty = ry;

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
      }
    };
    const onOver = (e: Event) => {
      const t = e.target;
      if (t instanceof HTMLElement) {
        setHover(Boolean(t.closest("a, button, [role=button], input, textarea, label, [data-cursor]")));
      }
    };
    const tick = () => {
      rx += (tx - rx) * 0.18;
      ry += (ty - ry) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };
    let raf = requestAnimationFrame(tick);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver, true);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div
        ref={dotRef}
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 6,
          height: 6,
          marginLeft: -3,
          marginTop: -3,
          background: "var(--rs-bronze-glow)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 90,
          mixBlendMode: "difference",
        }}
      />
      <div
        ref={ringRef}
        aria-hidden
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: hover ? 56 : 32,
          height: hover ? 56 : 32,
          border: "1px solid var(--rs-bronze)",
          borderRadius: "50%",
          pointerEvents: "none",
          zIndex: 89,
          transition: "width 220ms ease, height 220ms ease, background 220ms ease",
          background: hover ? "rgba(201,163,107,0.08)" : "transparent",
        }}
      />
    </>
  );
}
