import Reveal from "@/components/reveal";
import FaqItem from "@/components/faq-item";
import { prisma } from "@/lib/prisma";
import { faq as staticFaq } from "@/data/faq";

type FaqRow = { q: string; a: string };

async function getFaq(): Promise<FaqRow[]> {
  try {
    const rows = await prisma.faqItem.findMany({
      where: { published: true },
      orderBy: { sortOrder: "asc" },
    });
    if (rows.length > 0) {
      return rows.map((r) => ({ q: r.question, a: r.answer }));
    }
  } catch {
    // DB not available — fall through to static data
  }
  return staticFaq;
}

export default async function FaqSection() {
  const faq = await getFaq();

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
