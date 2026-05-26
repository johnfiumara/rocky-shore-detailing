"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "p" | "h2" | "h3" | "span";
};

const variants: Variants = {
  hidden: (custom: { y: number }) => ({ opacity: 0, y: custom.y }),
  show: { opacity: 1, y: 0 },
};

export default function Reveal({
  children,
  delay = 0,
  y = 24,
  className,
  as = "div",
}: Props) {
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      custom={{ y }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: [0.22, 0.7, 0.2, 1], delay }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}
