"use client";

import { cn } from "@/lib/cn";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-xs font-bold text-flame-ink">{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "w-full min-h-11 bg-flame-ivory border border-flame-blue/15 rounded-xl px-3.5 py-2.5 text-sm text-flame-ink placeholder-flame-muted/70 focus:outline-none focus:border-flame-orange focus:ring-2 focus:ring-flame-orange/20 font-medium transition-all";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cn(inputClass, props.className)} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(inputClass, "cursor-pointer font-semibold", props.className)}
    />
  );
}
