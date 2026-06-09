"use client";

import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode,
  isValidElement,
  cloneElement,
  type ReactElement,
} from "react";
import { Spinner } from "./spinner";

export type ButtonVariant = "primary" | "ghost" | "danger" | "link";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  asChild?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "btn-primary disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none",
  ghost:
    "btn-ghost disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent",
  danger:
    "inline-flex items-center gap-2 px-5 py-3 rounded-full border border-red-400/40 text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
  link: "inline-flex items-center gap-1 text-bronze hover:text-bronze-glow hover:underline transition-colors disabled:opacity-50",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "text-xs px-4 py-2",
  md: "",
  lg: "text-base px-7 py-4",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      isLoading = false,
      asChild = false,
      children,
      className = "",
      disabled,
      ...props
    },
    ref,
  ) => {
    const classes = [
      variantClasses[variant],
      variant !== "primary" && variant !== "ghost" ? "" : sizeClasses[size],
      className,
    ]
      .filter(Boolean)
      .join(" ");

    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<{ className?: string }>;
      return cloneElement(child, {
        className: [child.props.className, classes].filter(Boolean).join(" "),
      });
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={classes}
        {...props}
      >
        {isLoading && <Spinner size={16} />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
