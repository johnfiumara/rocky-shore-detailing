import Marquee from "@/components/marquee";
import Reveal from "@/components/reveal";
import { testimonials } from "@/data/testimonials";

function Quote({ quote, name, context }: { quote: string; name: string; context: string }) {
  return (
    <figure className="w-[420px] md:w-[480px] shrink-0 rounded-2xl border border-line bg-charcoal/40 backdrop-blur p-8">
      <blockquote className="font-display italic text-2xl text-bone leading-snug">
        &ldquo;{quote}&rdquo;
      </blockquote>
      <figcaption className="mt-6 flex items-baseline gap-3 font-mono-accent text-[11px] tracking-[0.2em] uppercase">
        <span className="text-bronze">{name}</span>
        <span className="text-mist">·</span>
        <span className="text-bone-dim">{context}</span>
      </figcaption>
    </figure>
  );
}

export default function TestimonialsSection() {
  const rowA = testimonials.slice(0, 3);
  const rowB = testimonials.slice(3);
  return (
    <section aria-labelledby="testimonials-h" className="relative py-32 md:py-44 border-t border-line overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 mb-16">
        <Reveal>
          <p className="eyebrow">In their words</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 id="testimonials-h" className="headline mt-6 text-5xl md:text-7xl">
            The work, <em>reviewed.</em>
          </h2>
        </Reveal>
      </div>

      <div className="space-y-8">
        <Marquee direction="left">
          {rowA.map((t, i) => <Quote key={`a-${i}`} {...t} />)}
        </Marquee>
        <Marquee direction="right">
          {rowB.map((t, i) => <Quote key={`b-${i}`} {...t} />)}
        </Marquee>
      </div>
    </section>
  );
}
