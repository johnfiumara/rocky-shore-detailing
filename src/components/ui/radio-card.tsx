import { type ReactNode, type InputHTMLAttributes } from "react";

export interface RadioCardProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  checked: boolean;
  children: ReactNode;
}

export function RadioCard({ checked, children, className = "", ...props }: RadioCardProps) {
  return (
    <label
      className={`cursor-pointer rounded-xl border p-5 transition-colors ${
        checked
          ? "border-bronze bg-bronze/8"
          : "border-line hover:border-bone-dim bg-charcoal/30"
      } ${className}`}
    >
      <input type="radio" className="sr-only" checked={checked} {...props} />
      {children}
    </label>
  );
}
