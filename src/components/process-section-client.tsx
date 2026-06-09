"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

type Step = { number: string; title: string; body: string };

export default function ProcessSectionClient({ steps }: { steps: Step[] }) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(max-width: 767px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const section = sectionRef.current;
    const track = trackRef.current;
    const progress = progressRef.current;
    if (!section || !track) return;

    const distance = () => track.scrollWidth - window.innerWidth;

    const ctx = gsap.context(() => {
      gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance()}`,
          scrub: 1,
          pin: true,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progress) progress.style.transform = `scaleX(${self.progress})`;
          },
        },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="process"
      aria-labelledby="process-h"
      className="relative border-t border-line overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-6 pt-32 md:pt-44 pb-12">
        <p className="eyebrow">The process</p>
        <h2 id="process-h" className="headline mt-6 text-5xl md:text-7xl max-w-3xl">
          From driveway<br />to <em>final reveal.</em>
        </h2>
      </div>

      <div className="hidden md:block relative">
        <div className="absolute top-12 left-6 right-6 h-px bg-line z-10">
          <div
            ref={progressRef}
            className="h-full bg-bronze origin-left scale-x-0"
            style={{ transformOrigin: "left center" }}
          />
        </div>
        <div ref={trackRef} className="flex gap-12 px-6 pb-40 pt-24 w-max">
          {steps.map((step) => (
            <article
              key={step.number}
              className="w-[70vw] max-w-[640px] shrink-0 rounded-2xl border border-line bg-charcoal/40 backdrop-blur p-10 md:p-14"
            >
              <p className="font-display text-[8rem] leading-none text-bronze opacity-90 select-none">
                {step.number}
              </p>
              <h3 className="font-display text-4xl md:text-5xl mt-6 text-bone">{step.title}</h3>
              <p className="mt-6 text-bone-dim leading-relaxed text-lg">{step.body}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="md:hidden px-6 pb-24 space-y-10">
        {steps.map((step) => (
          <article key={step.number} className="rounded-2xl border border-line bg-charcoal/40 p-8">
            <p className="font-display text-7xl leading-none text-bronze">{step.number}</p>
            <h3 className="font-display text-3xl mt-4 text-bone">{step.title}</h3>
            <p className="mt-4 text-bone-dim leading-relaxed">{step.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

