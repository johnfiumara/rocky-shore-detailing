import { type LabelHTMLAttributes, forwardRef } from "react";

export const Label = forwardRef<HTMLLabelElement, LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className = "", children, ...props }, ref) => (
    <label
      ref={ref}
      className={`block font-mono-accent text-[10px] tracking-[0.22em] uppercase text-mist mb-2 ${className}`}
      {...props}
    >
      {children}
    </label>
  ),
);

Label.displayName = "Label";
