"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

export default function BookingSuccess({ name }: { name: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 0.7, 0.2, 1] }}
      className="relative rounded-2xl border border-bronze/40 bg-charcoal/60 backdrop-blur p-12 md:p-16 text-center"
    >
      <div className="inline-flex size-16 items-center justify-center rounded-full bg-bronze text-ink mb-8">
        <Check size={28} strokeWidth={2.5} />
      </div>
      <p className="eyebrow">Booking received</p>
      <h3 className="headline mt-4 text-4xl md:text-5xl">
        Thanks, {name.split(" ")[0]}.<br />
        <em>We&apos;ll be in touch within 24 hours.</em>
      </h3>
      <p className="mt-6 max-w-md mx-auto text-bone-dim leading-relaxed">
        Aiden reviews each request personally. You&apos;ll get a confirmation
        email with the quote and a calendar invite once it&apos;s locked in.
      </p>
    </motion.div>
  );
}
