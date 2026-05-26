import Reveal from "@/components/reveal";
import FaqItem from "@/components/faq-item";
import { faq } from "@/data/faq";

export default function FaqSection() {
  return (
    <section id="faq" aria-labelledby="faq-h" className="relative py-32 md:py-44 border-t border-line">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <p className="eyebrow">Common questions</p>
        </Reveal>
        <Reveal delay={0.08}>
          <h2 id="faq-h" className="headline mt-6 text-5xl md:text-7xl mb-12">
            Things people <em>often ask.</em>
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <div className="border-b border-line">
            {faq.map((item) => (
              <FaqItem key={item.q} {...item} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
