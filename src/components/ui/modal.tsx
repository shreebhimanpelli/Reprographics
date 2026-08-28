"use client";

import { cn } from "@/lib/cn";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  wide?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  subtitle,
  icon,
  wide,
  className,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-flame-ink/45 backdrop-blur-md">
      <div
        className={cn(
          "w-full bg-flame-paper border border-flame-blue/10 shadow-module-lg overflow-hidden relative max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl",
          wide ? "sm:max-w-2xl" : "sm:max-w-lg",
          className,
        )}
      >
        {(title || icon) && (
          <div className="p-5 bg-flame-blue text-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {icon}
              <div className="min-w-0">
                {title && (
                  <h3 className="font-display font-bold text-base truncate">{title}</h3>
                )}
                {subtitle && (
                  <p className="text-xs text-white/80 truncate">{subtitle}</p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 min-h-11 min-w-11 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 mx-auto" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
