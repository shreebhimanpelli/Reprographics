"use client";

import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "accent" | "ghost" | "danger" | "outline" | "navy";

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 min-h-11 rounded-xl px-4 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-flame-blue hover:bg-flame-blue-deep text-white",
        variant === "accent" && "bg-flame-orange hover:bg-flame-orange/90 text-white",
        variant === "navy" && "bg-flame-blue-deep hover:bg-flame-blue text-white",
        variant === "ghost" &&
          "bg-transparent text-flame-muted hover:bg-flame-ivory hover:text-flame-ink",
        variant === "danger" &&
          "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100",
        variant === "outline" &&
          "border border-flame-blue/20 bg-flame-paper text-flame-blue hover:bg-flame-ivory",
        className,
      )}
      {...props}
    />
  );
}
