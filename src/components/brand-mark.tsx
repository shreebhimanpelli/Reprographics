import { cn } from "@/lib/cn";

export const FLAME_LOGO_SRC = "/flame-university.png";

type BrandMarkVariant = "header" | "hero" | "footer" | "mark";

export function BrandMark({
  compact = false,
  variant = "header",
  className,
}: {
  compact?: boolean;
  variant?: BrandMarkVariant;
  className?: string;
}) {
  if (variant === "hero") {
    return (
      <div
        className={cn(
          "mx-auto flex w-fit items-center justify-center bg-white rounded-2xl p-4 sm:p-5 ring-1 ring-flame-blue/10",
          className,
        )}
      >
        <img
          src={FLAME_LOGO_SRC}
          alt="FLAME University"
          className="h-28 sm:h-36 w-auto object-contain"
        />
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <div className={cn("flex flex-col items-center gap-2", className)}>
        <div className="bg-white rounded-xl p-2 ring-1 ring-flame-blue/10">
          <img
            src={FLAME_LOGO_SRC}
            alt="FLAME University"
            className="h-14 w-auto object-contain"
          />
        </div>
        <p className="text-[11px] uppercase tracking-[0.18em] text-flame-muted font-semibold">
          Igniting Minds
        </p>
      </div>
    );
  }

  if (variant === "mark") {
    return (
      <img
        src={FLAME_LOGO_SRC}
        alt="FLAME University"
        className={cn("w-auto object-contain", className)}
      />
    );
  }

  return (
    <div className={cn("flex items-center gap-2.5 min-w-0", className)}>
      <span className="flex-shrink-0 bg-white rounded-xl p-1 ring-1 ring-flame-blue/10">
        <img
          src={FLAME_LOGO_SRC}
          alt="FLAME University"
          className={cn("w-auto object-contain", compact ? "h-9" : "h-11")}
        />
      </span>
      <div className="min-w-0 hidden sm:block">
        <p className="font-display font-bold text-flame-blue text-sm leading-tight">
          Reprographics
        </p>
        <p className="text-[11px] text-flame-muted hidden md:block font-medium">
          Print Queue & Management Portal
        </p>
      </div>
    </div>
  );
}
