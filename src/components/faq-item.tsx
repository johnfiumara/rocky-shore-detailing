"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Minus } from "lucide-react";

export default function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-line">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-6 py-6 md:py-8 text-left group"
      >
        <span className="font-display text-2xl md:text-3xl text-bone group-hover:text-bronze-glow transition-colors">
          {q}
        </span>
        <span className="shrink-0 rounded-full border border-line p-2 text-bronze group-hover:border-bronze transition-colors">
          {open ? <Minus size={16} /> : <Plus size={16} />}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <p className="pb-8 max-w-2xl text-bone-dim leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
