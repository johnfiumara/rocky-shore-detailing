import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ children, label, className = "", ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={`inline-flex items-center justify-center rounded-full bg-ink/80 text-bone hover:bg-ink transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  ),
);

IconButton.displayName = "IconButton";
