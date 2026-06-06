"use client";

import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "#story", label: "Story" },
  { href: "#services", label: "Services" },
  { href: "#process", label: "Process" },
  { href: "#gallery", label: "Work" },
  { href: "#book", label: "Book" },
];

export default function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setHidden(y > 320 && y > lastY);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-transform duration-500 ${
        hidden && !open ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <div
        className={`mx-auto max-w-7xl px-6 py-4 flex items-center justify-between transition-colors duration-500 ${
          scrolled || open ? "backdrop-blur-md bg-ink/70 border-b border-line" : ""
        }`}
      >
        <a href="#top" className="flex items-baseline gap-2 font-display text-bone text-xl tracking-tight">
          <span>Rocky Coast</span>
          <span className="text-bronze italic font-light">Detailing</span>
        </a>
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="font-mono-accent text-[11px] tracking-[0.2em] uppercase text-bone-dim hover:text-bronze transition-colors"
            >
              {l.label}
            </a>
          ))}
        </nav>
        <a href="#book" className="hidden md:inline-flex btn-primary text-sm">Book a Detail</a>
        <button
          aria-label={open ? "Close menu" : "Open menu"}
          className="md:hidden text-bone p-2"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-ink/95 backdrop-blur-md border-b border-line px-6 py-8 flex flex-col gap-6">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="font-display text-3xl text-bone hover:text-bronze transition-colors"
            >
              {l.label}
            </a>
          ))}
          <a href="#book" onClick={() => setOpen(false)} className="btn-primary self-start mt-4">
            Book a Detail
          </a>
        </div>
      )}
    </header>
  );
}
