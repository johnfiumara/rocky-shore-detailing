import { forwardRef, type InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full bg-transparent border rounded-lg px-4 py-3 text-bone placeholder:text-mist/60 focus:border-bronze focus:outline-none transition-colors ${
        error ? "border-ember" : "border-line"
      } ${className}`}
      {...props}
    />
  ),
);

Input.displayName = "Input";
