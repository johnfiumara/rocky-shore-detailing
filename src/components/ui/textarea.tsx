import { forwardRef, type TextareaHTMLAttributes } from "react";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", error, ...props }, ref) => (
    <textarea
      ref={ref}
      className={`w-full bg-transparent border rounded-lg px-4 py-3 text-bone placeholder:text-mist/60 focus:border-bronze focus:outline-none transition-colors resize-y ${
        error ? "border-ember" : "border-line"
      } ${className}`}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
