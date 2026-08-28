import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

export function Card({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-flame-paper border border-flame-blue/10 rounded-2xl shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
