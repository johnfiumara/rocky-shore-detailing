"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { Service } from "@/data/services";

export default function ServiceCard({ service }: { service: Service }) {
  return (
    <motion.a
      href={`#book?service=${service.slug}`}
      onClick={(e) => {
        e.preventDefault();
        history.replaceState(null, "", `#book?service=${service.slug}`);
        document.getElementById("book")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
      className="group relative flex flex-col p-8 rounded-2xl border border-line bg-charcoal/40 backdrop-blur overflow-hidden"
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: "radial-gradient(60% 80% at 80% 0%, rgba(201,163,107,0.16), transparent 70%)",
        }}
      />
      
      <h3 className="font-display text-3xl md:text-4xl mt-3 text-bone relative">{service.title}</h3>
      <p className="mt-4 text-bone-dim leading-relaxed relative">{service.package}</p>
      <ul className="mt-6 space-y-2 text-sm text-bone-dim relative">
        {service.size.map((inc) => (
          <li key={inc} className="flex items-start gap-3">
            <span className="mt-2 size-1 rounded-full bg-bronze shrink-0" />
            <span>{inc}</span>
          </li>
        ))}
      </ul>
      <div className="mt-8 pt-6 border-t border-line flex items-center justify-between relative">
        <span className="font-mono-accent text-[11px] tracking-[0.2em] uppercase text-bronze">
          {service.priceFrom ? `From $${service.priceFrom[0]}` : "Request a quote"}
        </span>
        <ArrowUpRight size={18} className="text-bronze group-hover:rotate-12 transition-transform" />
      </div>
    </motion.a>
  );
}
