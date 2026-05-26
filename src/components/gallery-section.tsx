import Image from "next/image";
import Reveal from "@/components/reveal";
import BeforeAfter from "@/components/before-after";
import { beforeAfter, galleryGrid } from "@/data/gallery";

export default function GallerySection() {
  return (
    <section id="gallery" aria-labelledby="gallery-h" className="relative py-32 md:py-44 border-t border-line">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-12 mb-16">
          <div className="md:col-span-7">
            <Reveal>
              <p className="eyebrow">Selected work</p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 id="gallery-h" className="headline mt-6 text-5xl md:text-7xl">
                Drag the line.<br /><em>See the difference.</em>
              </h2>
            </Reveal>
          </div>
          <div className="md:col-span-4 md:col-start-9 self-end">
            <Reveal delay={0.16}>
              <p className="text-bone-dim leading-relaxed">{beforeAfter.label}</p>
            </Reveal>
          </div>
        </div>

        <Reveal>
          <BeforeAfter pair={beforeAfter} />
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3 mt-16">
          {galleryGrid.map((img, i) => (
            <Reveal key={img.src} delay={i * 0.05}>
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-line group">
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(min-width: 768px) 30vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
