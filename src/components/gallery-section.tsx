"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Reveal from "@/components/reveal";
import BeforeAfter from "@/components/before-after";
import { beforeAfterPair as beforeAfter, galleryGrid } from "@/data/gallery";

export default function GallerySection() {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    skipSnaps: false,
    duration: 28,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const scrollTo = useCallback(
    (i: number) => emblaApi?.scrollTo(i),
    [emblaApi],
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect).on("reInit", onSelect);
    return () => {
      emblaApi.off("select", onSelect).off("reInit", onSelect);
    };
  }, [emblaApi]);

  const totalSlides = galleryGrid.length + 1;

  return (
    <section
      id="gallery"
      aria-labelledby="gallery-h"
      className="relative py-32 md:py-44 border-t border-line"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-12 mb-16">
          <div className="md:col-span-7">
            <Reveal>
              <p className="eyebrow">Selected work</p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 id="gallery-h" className="headline mt-6 text-5xl md:text-7xl">
                Drag the line.
                <br />
                <em>See the difference.</em>
              </h2>
            </Reveal>
          </div>
          <div className="md:col-span-4 md:col-start-9 self-end">
            <Reveal delay={0.16}>
              <p className="text-bone-dim leading-relaxed">
                {beforeAfter.label}
              </p>
            </Reveal>
          </div>
        </div>

        <Reveal>
          <div
            role="region"
            aria-roledescription="carousel"
            aria-label="Selected detailing work"
            className="relative"
          >
            <div className="overflow-hidden rounded-2xl" ref={emblaRef}>
              <div className="flex touch-pan-y">
                <div
                  className="relative shrink-0 grow-0 basis-full pl-0 pr-4"
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`1 of ${totalSlides}: before and after`}
                  onPointerDownCapture={(e) => e.stopPropagation()}
                >
                  <BeforeAfter pair={beforeAfter} />
                </div>

                {galleryGrid.map((img, i) => (
                  <div
                    key={img.src}
                    className="relative shrink-0 grow-0 basis-full pl-0 pr-4"
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${i + 2} of ${totalSlides}`}
                  >
                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-line">
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        sizes="(min-width: 768px) 75vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={scrollPrev}
              aria-label="Previous slide"
              className="absolute left-2 md:-left-4 top-1/2 -translate-y-1/2 size-12 rounded-full border border-line-strong bg-ink/70 backdrop-blur text-bone hover:text-bronze hover:border-bronze transition-colors flex items-center justify-center"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={scrollNext}
              aria-label="Next slide"
              className="absolute right-2 md:-right-4 top-1/2 -translate-y-1/2 size-12 rounded-full border border-line-strong bg-ink/70 backdrop-blur text-bone hover:text-bronze hover:border-bronze transition-colors flex items-center justify-center"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
              >
                <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            <div className="mt-8 flex items-center justify-between gap-6">
              <div
                className="flex flex-wrap items-center gap-2"
                role="tablist"
                aria-label="Slide selection"
              >
                {Array.from({ length: totalSlides }, (_, i) => {
                  const active = i === selectedIndex;
                  return (
                    <button
                      key={i}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-label={`Go to slide ${i + 1}`}
                      onClick={() => scrollTo(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        active
                          ? "w-10 bg-bronze"
                          : "w-5 bg-bone/30 hover:bg-bone/60"
                      }`}
                    />
                  );
                })}
              </div>
              <p
                className="font-mono-accent text-[10px] tracking-[0.2em] uppercase text-bone-dim"
                aria-live="polite"
              >
                {String(selectedIndex + 1).padStart(2, "0")} / {String(totalSlides).padStart(2, "0")}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
