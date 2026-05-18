// Reusable button primitive — variants: primary, secondary, danger, ghost.
"use client";

import React from "react";
import Spinner from "./Spinner.jsx";

const base =
  "inline-flex items-center justify-center gap-2 font-extrabold cursor-pointer border transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 disabled:opacity-55 disabled:cursor-not-allowed disabled:transform-none";

const variants = {
  primary:
    "border-transparent bg-secondary text-white shadow-[0_10px_18px_rgba(215,122,97,0.22)] hover:not-disabled:-translate-y-px hover:not-disabled:shadow-lg",
  secondary:
    "border-border/40 bg-surface-elevated text-text-primary hover:not-disabled:border-border-strong hover:not-disabled:-translate-y-px hover:not-disabled:shadow-[0_4px_16px_rgba(34,56,67,0.08)]",
  danger:
    "border-status-danger/40 bg-surface-elevated text-status-danger hover:not-disabled:bg-status-danger/8 hover:not-disabled:border-status-danger/60",
  ghost:
    "border-transparent bg-transparent text-text-muted hover:not-disabled:text-secondary hover:not-disabled:bg-[rgba(215,122,97,0.06)]",
};

const sizes = {
  sm: "px-3 py-1.5 text-[11.5px] rounded-[8px]",
  md: "px-4 py-[11px] text-sm rounded-sm",
  lg: "px-7 py-4 text-base rounded-pill min-h-[54px]",
};

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Button = React.forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    type = "button",
    className = "",
    children,
    onClick,
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(base, variants[variant] ?? variants.primary, sizes[size] ?? sizes.md, className)}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
});

export default Button;
