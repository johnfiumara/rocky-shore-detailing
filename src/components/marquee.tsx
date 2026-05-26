import type { ReactNode } from "react";

export default function Marquee({
  children,
  direction = "left",
  className = "",
}: {
  children: ReactNode;
  direction?: "left" | "right";
  className?: string;
}) {
  return (
    <div className={`rs-marquee overflow-hidden ${className}`}>
      <div
        className="rs-marquee-track flex w-max gap-12"
        style={{ animationDirection: direction === "right" ? "reverse" : "normal" }}
      >
        <div className="flex gap-12 shrink-0">{children}</div>
        <div className="flex gap-12 shrink-0" aria-hidden>{children}</div>
      </div>
    </div>
  );
}
