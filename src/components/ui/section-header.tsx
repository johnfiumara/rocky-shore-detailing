import Reveal from "@/components/reveal";

export function SectionHeader({
  eyebrow,
  headline,
  delay = 0,
}: {
  eyebrow: string;
  headline: React.ReactNode;
  delay?: number;
}) {
  return (
    <>
      <Reveal delay={delay}>
        <p className="eyebrow">{eyebrow}</p>
      </Reveal>
      <Reveal delay={delay + 0.08}>
        <h2 className="headline mt-6 text-5xl md:text-7xl mb-12">{headline}</h2>
      </Reveal>
    </>
  );
}
