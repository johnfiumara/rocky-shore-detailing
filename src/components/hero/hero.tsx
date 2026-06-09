"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ArrowDown } from "lucide-react";
import "@/lib/theatre-studio";
import HeroCanvas from "./hero-canvas";
import { getHeroSheet } from "./hero-timeline";

export default function Hero() {
  const headlineRef = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const el = headlineRef.current;
    if (!el) return;
    const chars = el.querySelectorAll<HTMLSpanElement>("[data-char]");
    gsap.fromTo(
      chars,
      { y: "110%", opacity: 0 },
      { y: "0%", opacity: 1, stagger: 0.02, duration: 1.1, ease: "expo.out", delay: 0.25 },
    );

    getHeroSheet();
  }, []);

  return (
    <section
      id="top"
      aria-labelledby="hero-h"
      className="relative isolate min-h-[100svh] flex items-end overflow-hidden"
    >
      <HeroCanvas />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3"
        style={{ background: "linear-gradient(180deg, transparent, rgba(10,11,13,0.85))" }}
      />

      <div className="relative mx-auto max-w-7xl w-full px-6 pb-24 md:pb-32 pt-40">
        <p className="eyebrow opacity-90">Mobile Auto Detailing · Statewide Maine</p>
        <h1
          id="hero-h"
          ref={headlineRef}
          className="headline mt-6 text-[clamp(3rem,9vw,8.5rem)] max-w-5xl"
        >
          <SplitText text="Glass-deep" />
          <br />
          <SplitText text="finish, " />
          <em><SplitText text="by hand." /></em>
        </h1>
        <p className="mt-10 max-w-xl text-bone-dim text-lg leading-relaxed">
          Aiden Quinn brings the studio to your driveway — paint correction, ceramic coatings,
          and full restorations across Maine.
        </p>
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a href="#book" className="btn-primary">Book a Detail</a>
          <a href="#gallery" className="btn-ghost">See the work</a>
        </div>
      </div>

      <a
        href="#story"
        aria-label="Scroll to story"
        className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 font-mono-accent text-[10px] tracking-[0.22em] uppercase text-bone-dim"
      >
        <span>Scroll</span>
        <ArrowDown size={14} className="animate-bounce" />
      </a>
    </section>
  );
}

function SplitText({ text }: { text: string }) {
  return (
    <span aria-label={text} className="inline-block">
      {Array.from(text).map((c, i) => (
        <span
          key={i}
          data-char
          className="inline-block whitespace-pre"
          style={{ willChange: "transform, opacity" }}
        >
          {c}
        </span>
      ))}
    </span>
  );
}
