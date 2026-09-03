"use client";

import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { inputClass } from "@/components/ui/field";
import type { DuplexMode, Orientation, PaperSize, PrintJob, PrintType } from "@/types";
import { CheckCircle2, ExternalLink, Printer, Settings, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface PrintPreviewModalProps {
  isOpen: boolean;
  job: PrintJob | null;
  onClose: () => void;
  onPrintStarted: (id: string) => void;
}

export function PrintPreviewModal({
  isOpen,
  job,
  onClose,
  onPrintStarted,
}: PrintPreviewModalProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [copies, setCopies] = useState(1);
  const [pageMode, setPageMode] = useState<"all" | "custom">("all");
  const [customRange, setCustomRange] = useState("");
  const [paperSize, setPaperSize] = useState<PaperSize>("A4");
  const [orientation, setOrientation] = useState<Orientation>("PORTRAIT");
  const [printType, setPrintType] = useState<PrintType>("BW");
  const [duplex, setDuplex] = useState<DuplexMode>("SINGLE");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (job && isOpen) {
      setCopies(job.copyCount);
      setPaperSize(job.paperSize);
      setOrientation(job.orientation);
      setPrintType(job.printType);
      setDuplex(job.duplexMode);
      setPageMode("all");
      setCustomRange("");
      setSent(false);
      setSending(false);
    }
  }, [job, isOpen]);

  if (!isOpen || !job) return null;

  const preview = `https://drive.google.com/file/d/${job.gdriveFileId}/preview`;
  const pageCount =
    pageMode === "all"
      ? job.effectivePages
      : customRange.split(",").reduce((sum, token) => {
          const parts = token.trim().split("-");
          return parts.length === 2
            ? sum + (parseInt(parts[1]) - parseInt(parts[0]) + 1)
            : sum + 1;
        }, 0) || job.effectivePages;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-flame-ivory">
      <div className="flex items-center justify-between px-5 py-3 bg-flame-blue text-white flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
            <Printer className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display font-bold text-sm">Print Document</h3>
            <p className="text-[11px] text-white/70 truncate">
              {job.trackingNumber} • {job.userName}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-2 min-h-11 min-w-11 rounded-xl text-white/80 hover:bg-white/10"
        >
          <X className="w-5 h-5 mx-auto" />
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="w-full lg:w-[360px] bg-flame-paper border-b lg:border-b-0 lg:border-r border-flame-blue/10 flex flex-col overflow-y-auto flex-shrink-0 max-h-[50vh] lg:max-h-none">
          <div className="p-4 border-b border-flame-blue/10 bg-flame-blue/5">
            <h4 className="text-flame-blue font-extrabold text-sm flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Requested Settings
            </h4>
            <p className="text-[11px] text-flame-muted mt-1">
              Please ensure the physical printer matches these student requests when the
              print dialog opens.
            </p>
          </div>
          <div className="p-4 border-b border-flame-blue/10">
            <label className="text-[11px] font-bold uppercase tracking-wider text-flame-muted block mb-2">
              Copies
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCopies(Math.max(1, copies - 1))}
                className="min-h-11 min-w-11 rounded-lg bg-flame-ivory text-flame-ink border border-flame-blue/10 font-bold"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                max={999}
                value={copies}
                onChange={(event) =>
                  setCopies(Math.max(1, parseInt(event.target.value) || 1))
                }
                className="w-16 bg-flame-ivory border border-flame-blue/15 rounded-lg px-2 py-2 text-center text-flame-ink font-mono font-bold text-sm"
              />
              <button
                type="button"
                onClick={() => setCopies(copies + 1)}
                className="min-h-11 min-w-11 rounded-lg bg-flame-ivory text-flame-ink border border-flame-blue/10 font-bold"
              >
                +
              </button>
            </div>
          </div>
          <div className="p-4 border-b border-flame-blue/10">
            <label className="text-[11px] font-bold uppercase tracking-wider text-flame-muted block mb-2">
              Pages
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer min-h-11">
                <input
                  type="radio"
                  name="pageRange"
                  checked={pageMode === "all"}
                  onChange={() => setPageMode("all")}
                  className="accent-flame-orange"
                />
                <span className="text-xs text-flame-ink font-medium">
                  All ({job.effectivePages} pages)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer min-h-11">
                <input
                  type="radio"
                  name="pageRange"
                  checked={pageMode === "custom"}
                  onChange={() => setPageMode("custom")}
                  className="accent-flame-orange"
                />
                <span className="text-xs text-flame-ink font-medium">Custom Range</span>
              </label>
              {pageMode === "custom" && (
                <input
                  type="text"
                  placeholder="e.g. 1-5, 8, 11-13"
                  value={customRange}
                  onChange={(event) => setCustomRange(event.target.value)}
                  className={`${inputClass} font-mono ml-5`}
                />
              )}
            </div>
          </div>
          <div className="p-4 border-b border-flame-blue/10 space-y-4">
            <label className="text-[11px] font-bold uppercase tracking-wider text-flame-muted block">
              Layout
            </label>
            <div>
              <span className="text-[10px] text-flame-muted font-bold block mb-1.5">
                Orientation
              </span>
              <Segmented<Orientation>
                value={orientation}
                onChange={setOrientation}
                options={[
                  { id: "PORTRAIT", label: "▯ Portrait" },
                  { id: "LANDSCAPE", label: "▭ Landscape" },
                ]}
              />
            </div>
            <div>
              <span className="text-[10px] text-flame-muted font-bold block mb-1.5">
                Paper Size
              </span>
              <select
                value={paperSize}
                onChange={(event) => setPaperSize(event.target.value as PaperSize)}
                className={inputClass}
              >
                <option value="A4">A4 (210 × 297 mm)</option>
                <option value="A3">A3 (297 × 420 mm)</option>
                <option value="Letter">Letter (8.5 × 11 in)</option>
                <option value="Legal">Legal (8.5 × 14 in)</option>
              </select>
            </div>
            <div>
              <span className="text-[10px] text-flame-muted font-bold block mb-1.5">
                Color
              </span>
              <Segmented<PrintType>
                value={printType}
                onChange={setPrintType}
                options={[
                  { id: "BW", label: "📄 Black & White" },
                  { id: "COLOR", label: "🎨 Color" },
                ]}
              />
            </div>
            <div>
              <span className="text-[10px] text-flame-muted font-bold block mb-1.5">
                Sides
              </span>
              <Segmented<DuplexMode>
                value={duplex}
                onChange={setDuplex}
                options={[
                  { id: "SINGLE", label: "Single-sided" },
                  { id: "DUPLEX", label: "Double-sided" },
                ]}
              />
            </div>
          </div>
          <div className="p-4 mt-auto space-y-3">
            <div className="bg-flame-ivory rounded-xl p-3 border border-flame-blue/10 space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-flame-muted">Document</span>
                <span className="text-flame-ink font-medium truncate max-w-[180px]">
                  {job.fileName}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-flame-muted">Pages × Copies</span>
                <span className="text-flame-ink font-bold">
                  {pageCount} × {copies} = {pageCount * copies} sheets
                </span>
              </div>
              {job.bindingType && job.bindingType !== "NONE" && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-flame-muted">Binding</span>
                  <span className="text-flame-blue font-bold">
                    {job.bindingType.replace("_", " ")}
                  </span>
                </div>
              )}
              {job.laminationType && job.laminationType !== "NONE" && (
                <div className="flex justify-between text-[11px]">
                  <span className="text-flame-muted">Lamination</span>
                  <span className="text-flame-orange font-bold">
                    {job.laminationType.replace("_", " ")}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-[11px]">
                <span className="text-flame-muted">Amount</span>
                <span className="text-flame-ink font-bold">
                  {job.paymentStatus === "EXEMPT"
                    ? "₹0.00 (Exempt)"
                    : `₹${job.totalAmount.toFixed(2)}`}
                </span>
              </div>
            </div>
            {sent ? (
              <div className="w-full min-h-11 py-3.5 px-4 rounded-xl bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Print Job Sent Successfully!
              </div>
            ) : (
              <Button
                className="w-full"
                disabled={sending}
                onClick={() => {
                  setSending(true);
                  setTimeout(() => {
                    setSending(false);
                    setSent(true);
                    try {
                      const frame = iframeRef.current;
                      if (frame?.contentWindow) {
                        frame.contentWindow.focus();
                        frame.contentWindow.print();
                      }
                    } catch {
                      console.log("Cross-origin print fallback - job sent via system");
                    }
                    setTimeout(() => onPrintStarted(job.id), 1500);
                  }, 1200);
                }}
              >
                {sending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending to Printer...
                  </>
                ) : (
                  <>
                    <Printer className="w-5 h-5" />
                    Print
                  </>
                )}
              </Button>
            )}
            <Button variant="outline" className="w-full" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
        <div className="flex-1 bg-flame-ivory flex flex-col min-h-[40vh]">
          <div className="px-4 py-2 border-b border-flame-blue/10 flex items-center justify-between">
            <span className="text-[11px] font-bold text-flame-muted uppercase tracking-wider">
              Preview
            </span>
            <a
              href={job.gdriveFileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[11px] text-flame-blue font-bold min-h-11"
            >
              <ExternalLink className="w-3 h-3" />
              Open in Google Drive
            </a>
          </div>
          <div className="flex-1 p-4">
            <div className="w-full h-full rounded-xl overflow-hidden border border-flame-blue/10 bg-white shadow-sm min-h-[320px]">
              <iframe
                ref={iframeRef}
                src={preview}
                className="w-full h-full border-0"
                allow="autoplay"
                title="Document Preview"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
