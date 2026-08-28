import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

type Tone =
  | "blue"
  | "orange"
  | "gold"
  | "emerald"
  | "rose"
  | "amber"
  | "cyan"
  | "teal"
  | "purple"
  | "muted";

const tones: Record<Tone, string> = {
  blue: "bg-flame-blue/10 text-flame-blue border-flame-blue/20",
  orange: "bg-flame-orange/10 text-flame-orange border-flame-orange/25",
  gold: "bg-flame-gold/20 text-flame-blue-deep border-flame-gold/40",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rose: "bg-rose-50 text-rose-700 border-rose-200",
  amber: "bg-amber-50 text-amber-800 border-amber-200",
  cyan: "bg-cyan-50 text-cyan-800 border-cyan-200",
  teal: "bg-teal-50 text-teal-800 border-teal-200",
  purple: "bg-purple-50 text-purple-800 border-purple-200",
  muted: "bg-flame-ivory text-flame-muted border-flame-blue/10",
};

export function Badge({
  className,
  tone = "blue",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
