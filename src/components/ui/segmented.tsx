"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { id: T; label: ReactNode }[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid gap-1.5 bg-flame-ivory p-1.5 rounded-2xl border border-flame-blue/10",
        options.length === 2 && "grid-cols-2",
        options.length === 3 && "grid-cols-3",
        options.length >= 4 && "flex flex-wrap",
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            "min-h-11 px-3 rounded-xl text-xs font-bold transition-all",
            value === option.id
              ? "bg-flame-orange text-white shadow-sm"
              : "text-flame-muted hover:text-flame-ink hover:bg-flame-paper",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
