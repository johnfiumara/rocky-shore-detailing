import Reveal from "@/components/reveal";
import ServiceCard from "@/components/service-card";
import { prisma } from "@/lib/prisma";
import { services as staticServices } from "@/data/services";

async function getServices() {
  try {
    const rows = await prisma.service.findMany({
      where: { active: true },
      orderBy: { sortOrder: "asc" },
      include: { tiers: { orderBy: { size: "asc" } } },
    });
    if (rows.length > 0) return rows;
  } catch {
    // DB not available — fall through to static data
  }
  return staticServices;
}

export default async function ServicesSection() {
  const services = await getServices();

  return (
    <section id="services" aria-labelledby="services-h" className="relative py-32 md:py-44 border-t border-line">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-10 md:grid-cols-12 mb-16 md:mb-24">
          <div className="md:col-span-7">
            <Reveal>
              <p className="eyebrow">What we offer</p>
            </Reveal>
            <Reveal delay={0.08}>
              <h2 id="services-h" className="headline mt-6 text-5xl md:text-7xl">
                Five services.<br /><em>One pair of hands.</em>
              </h2>
            </Reveal>
          </div>
          <div className="md:col-span-4 md:col-start-9 self-end">
            <Reveal delay={0.16}>
              <p className="text-bone-dim leading-relaxed">
                Built around the most common asks. Bundle, modify, or ask for something else entirely on the booking form.
              </p>
            </Reveal>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => (
            <Reveal key={s.slug} delay={i * 0.06}>
              <ServiceCard service={s} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
