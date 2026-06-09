import { type ReactNode } from "react";
import { Label } from "./label";
import { FieldError } from "./field-error";

export function FormField({
  label,
  error,
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="block">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      <FieldError msg={error} />
    </div>
  );
}
