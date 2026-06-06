import Reveal from "@/components/reveal";

export default function StorySection() {
  return (
    <section id="story" aria-labelledby="story-h" className="relative py-32 md:py-44">
      <div className="mx-auto max-w-7xl px-6 grid gap-16 md:grid-cols-12">
        <div className="md:col-span-5">
          <Reveal>
            <p className="eyebrow">The Studio</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h2 id="story-h" className="headline mt-6 text-5xl md:text-7xl">
              An Aiden Quinn<br />studio,<br /><em>on wheels.</em>
            </h2>
          </Reveal>
          <Reveal delay={0.16}>
            <div className="mt-10 h-px w-24 bg-bronze" />
          </Reveal>
        </div>

        <div className="md:col-span-6 md:col-start-7 self-end space-y-6 text-bone-dim leading-relaxed text-lg">
          <Reveal delay={0.1}>
            <p>
              Rocky Coast started in a single garage in Portland, the kind of operation where a 2-stage polish meant
              missing dinner. Today it&apos;s a fully-equipped mobile studio that shows up at your driveway with water,
              power, and product — so you never give up your day to a shop.
            </p>
          </Reveal>
          <Reveal delay={0.2}>
            <p>
              Aiden Quinn is the only set of hands on every job. No subcontractors, no quick-fix passes. Every car
              gets paint readings before correction; every coating gets a 12-hour cure window honored to the minute.
              The standard he applies to a daily driver is the standard he applies to a concours collection.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <p className="font-mono-accent text-[11px] tracking-[0.22em] uppercase text-bronze">
              Detailing Maine · Kittery to Madawaska · 2018 →
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
