"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { inputClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { analyzeDocument } from "@/lib/pdfanalyzer";
import { calculatePrice, countSelectedPages } from "@/lib/pricecalculator";
import type {
  CartItem,
  NewPrintJobInput,
  Orientation,
  PaperSize,
  PricingConfig,
  PrintJob,
  PrintType,
  DuplexMode,
  User,
} from "@/types";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  File,
  FileText,
  IndianRupee,
  LayoutGrid,
  Shield,
  Trash2,
  Upload,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

interface PrintFormProps {
  currentUser: User;
  pricingConfig: PricingConfig;
  onSubmitJob: (job: NewPrintJobInput) => PrintJob;
  onProceedToPayment: (jobs: PrintJob[]) => void;
  onSuccessDirect: (jobs: PrintJob[]) => void;
}

function generateTrackingNumber() {
  const year = new Date().getFullYear();
  return `REP-${year}-${Math.floor(10000 + 90000 * Math.random())}`;
}

export function PrintForm({
  currentUser,
  pricingConfig,
  onSubmitJob,
  onProceedToPayment,
  onSuccessDirect,
}: PrintFormProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [adminBillingMode, setAdminBillingMode] = useState<"EXEMPT" | "CHARGEABLE">("EXEMPT");
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(
    null,
  );

  const grandTotal = items.reduce((sum, item) => sum + item.totalCost, 0);
  const impressions = items.reduce(
    (sum, item) => sum + item.effectivePages * item.copyCount,
    0,
  );
  const allExempt = items.length > 0 && items.every((item) => item.isExempt);

  const priceItem = (item: CartItem, mode = adminBillingMode): CartItem => {
    const effectivePages = countSelectedPages(item.selectedPageRange, item.pageCount);
    const priced = calculatePrice(
      effectivePages,
      item.copyCount,
      item.printType,
      currentUser.role,
      pricingConfig,
      item.duplexMode,
      item.paperSize,
      currentUser.role === "SUPER_ADMIN" ? mode : undefined,
    );
    return {
      ...item,
      effectivePages,
      ratePerPage: priced.ratePerPage,
      totalCost: priced.totalCost,
      isExempt: priced.isExempt,
      paperSheetsConsumed: priced.paperSheetsConsumed,
    };
  };

  useEffect(() => {
    setItems((prev) => prev.map((item) => priceItem(item, adminBillingMode)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.role, pricingConfig, adminBillingMode]);

  const patchItem = (id: string, patch: Partial<CartItem>) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? priceItem({ ...item, ...patch }) : item)),
    );
  };

  const addFiles = async (fileList: FileList) => {
    const next: CartItem[] = Array.from(fileList).map((file) => ({
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      file,
      pageCount: 1,
      selectedPageRange: "All",
      printType: "BW",
      duplexMode: "SINGLE",
      paperSize: "A4",
      orientation: "PORTRAIT",
      copyCount: 1,
      effectivePages: 1,
      paperSheetsConsumed: 1,
      totalCost: 0,
      ratePerPage: 0,
      isExempt: false,
      detectingPages: true,
      isExpanded: true,
    }));

    setItems((prev) => [...prev, ...next]);

    for (const item of next) {
      try {
        const analyzed = await analyzeDocument(item.file);
        setItems((prev) =>
          prev.map((row) => {
            if (row.id !== item.id) return row;
            return priceItem({
              ...row,
              pageCount: analyzed.pageCount,
              fileDataUrl: analyzed.dataUrl,
              detectingPages: false,
            });
          }),
        );
      } catch (error) {
        console.error("Error analyzing file:", error);
        setItems((prev) =>
          prev.map((row) =>
            row.id === item.id ? { ...row, detectingPages: false } : row,
          ),
        );
      }
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (items.length === 0) return;
    if (items.some((item) => item.detectingPages)) {
      alert("Please wait for all documents to finish page detection before submitting.");
      return;
    }
    setSubmitting(true);
    setProgress({ current: 0, total: items.length });
    try {
      const trackingNumber = generateTrackingNumber();
      const created: PrintJob[] = [];
      let current = 0;
      for (const item of items) {
        current += 1;
        setProgress({ current, total: items.length });
        const form = new FormData();
        form.append("file", item.file);
        form.append("trackingNumber", trackingNumber);
        form.append("role", currentUser.role);
        const response = await fetch("/api/drive-upload", {
          method: "POST",
          body: form,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            `Failed to upload ${item.file.name}: ${data.error || "Unknown error"}`,
          );
        }
        const jobStatus = "QUEUED";
        const paymentStatus = item.isExempt ? "EXEMPT" : "PENDING_PAYMENT";
        created.push(
          onSubmitJob({
            trackingNumber,
            userId: currentUser.id,
            userName: currentUser.name,
            userEmail: currentUser.email,
            userRole: currentUser.role,
            fileName: item.file.name,
            fileSize: item.file.size,
            fileType: item.file.type || "document",
            fileDataUrl: item.fileDataUrl,
            gdriveFileUrl: data.webViewLink,
            gdriveFileId: data.fileId,
            pageCount: item.pageCount,
            selectedPageRange: item.selectedPageRange,
            effectivePages: item.effectivePages,
            copyCount: item.copyCount,
            paperSheetsConsumed: item.paperSheetsConsumed,
            paperSize: item.paperSize,
            orientation: item.orientation,
            printType: item.printType,
            duplexMode: item.duplexMode,
            totalAmount: item.totalCost,
            paymentStatus,
            jobStatus,
          }),
        );
      }
      setSubmitting(false);
      setProgress(null);
      if (allExempt) onSuccessDirect(created);
      else onProceedToPayment(created);
    } catch (error) {
      console.error("Submission failed:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to upload documents. Please try again.",
      );
      setSubmitting(false);
      setProgress(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <Card className="p-5 sm:p-8">
        <div className="flex flex-col gap-4 border-b border-flame-blue/10 pb-5 mb-6">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-flame-blue/10 text-flame-blue border border-flame-blue/15">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="font-display text-xl font-bold text-flame-blue tracking-tight">
              New Print Job Submission
            </h2>
          </div>
          <p className="text-xs text-flame-muted font-medium">
            Upload multiple documents and configure their print settings.
          </p>
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-flame-ivory border border-flame-blue/10 text-flame-ink text-xs font-bold self-start">
            <IndianRupee className="w-4 h-4 text-flame-orange" />
            <span>
              B&W: ₹{pricingConfig.bwPricePerPage.toFixed(2)}/pg | Color: ₹
              {pricingConfig.colorPricePerPage.toFixed(2)}/pg
            </span>
          </div>

          {currentUser.role === "SUPER_ADMIN" && (
            <div className="p-4 rounded-2xl bg-flame-ivory border border-flame-blue/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-flame-blue/10 text-flame-blue border border-flame-blue/15 flex-shrink-0">
                  <Shield className="w-5 h-5 text-flame-blue" />
                </div>
                <div>
                  <p className="text-xs font-bold text-flame-ink flex items-center gap-2">
                    <span>Super Admin Billing Mode</span>
                    {adminBillingMode === "EXEMPT" ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                        100% Exempt (₹0.00)
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">
                        Standard Chargeable (UPI)
                      </span>
                    )}
                  </p>
                  <p className="text-[11px] text-flame-muted mt-0.5">
                    Choose whether this submission is an official exempt order or standard chargeable.
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-auto flex-shrink-0">
                <Segmented<"EXEMPT" | "CHARGEABLE">
                  value={adminBillingMode}
                  onChange={(mode) => setAdminBillingMode(mode)}
                  options={[
                    { id: "EXEMPT", label: "Exempt (₹0.00)" },
                    { id: "CHARGEABLE", label: "Chargeable (UPI)" },
                  ]}
                />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-flame-muted mb-2">
              1. Upload Documents (Multiple Allowed)
            </label>
            <div
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                if (event.dataTransfer.files?.length) addFiles(event.dataTransfer.files);
              }}
              className="relative border-2 border-dashed border-flame-blue/20 hover:border-flame-orange rounded-2xl p-8 text-center bg-flame-ivory hover:bg-flame-gold/10 transition-all cursor-pointer group"
            >
              <input
                type="file"
                multiple
                accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp"
                onChange={(event) => {
                  if (event.target.files?.length) addFiles(event.target.files);
                  event.target.value = "";
                }}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              />
              <div className="w-16 h-16 rounded-2xl bg-flame-blue/10 text-flame-blue flex items-center justify-center mx-auto mb-4 border border-flame-blue/15 group-hover:scale-110 transition-all">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-flame-ink mb-1">
                Drag & Drop documents here, or{" "}
                <span className="text-flame-orange underline">browse files</span>
              </h3>
              <p className="text-xs text-flame-muted font-medium">
                Supports PDF, Microsoft Word (.docx), PowerPoint (.pptx), PNG, JPG up to
                50MB
              </p>
            </div>
          </div>

          {items.length > 0 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-flame-muted">
                2. Cart: {items.length} Document(s) Added
              </label>
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-2xl border transition-all overflow-hidden",
                      item.isExpanded
                        ? "border-flame-orange/40 shadow-sm bg-flame-paper"
                        : "border-flame-blue/10 bg-flame-ivory hover:border-flame-blue/20",
                    )}
                  >
                    <div
                      className="p-4 flex items-center justify-between cursor-pointer select-none gap-3"
                      onClick={() => patchItem(item.id, { isExpanded: !item.isExpanded })}
                    >
                      <div className="flex items-center gap-3 truncate min-w-0">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border",
                            item.detectingPages
                              ? "bg-flame-ivory text-flame-muted border-flame-blue/10"
                              : "bg-flame-blue/10 text-flame-blue border-flame-blue/15",
                          )}
                        >
                          {item.detectingPages ? (
                            <LayoutGrid className="w-5 h-5 animate-pulse" />
                          ) : (
                            <File className="w-5 h-5" />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="font-bold text-flame-ink text-sm truncate">
                            {item.file.name}
                          </p>
                          <p className="text-xs text-flame-muted font-medium">
                            {(item.file.size / 1024 / 1024).toFixed(2)} MB •{" "}
                            {item.pageCount} page(s) • {item.printType} • {item.copyCount}{" "}
                            copy(ies)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right hidden sm:block">
                          <p className="text-sm font-black text-flame-blue">
                            ₹{item.totalCost.toFixed(2)}
                          </p>
                          {item.isExempt && (
                            <p className="text-[9px] font-bold text-emerald-700 uppercase">
                              Exempt
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setItems((prev) => prev.filter((row) => row.id !== item.id));
                          }}
                          className="p-2 min-h-11 min-w-11 text-flame-muted hover:text-rose-600 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                        <div className="p-1 text-flame-muted">
                          {item.isExpanded ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </div>
                      </div>
                    </div>

                    {item.isExpanded && (
                      <div className="p-5 border-t border-flame-blue/10 bg-flame-ivory/60">
                        {item.detectingPages ? (
                          <div className="flex flex-col items-center justify-center py-6">
                            <div className="w-6 h-6 border-2 border-flame-orange border-t-transparent rounded-full animate-spin mb-2" />
                            <p className="text-xs text-flame-blue font-bold">
                              Analyzing document & counting pages...
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="space-y-2">
                              <span className="text-xs font-bold text-flame-ink">
                                Paper Size
                              </span>
                              <Segmented<PaperSize>
                                value={item.paperSize}
                                onChange={(paperSize) => patchItem(item.id, { paperSize })}
                                options={[
                                  { id: "A4", label: "A4" },
                                  { id: "A3", label: "A3" },
                                ]}
                              />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                              <span className="text-xs font-bold text-flame-ink">
                                Print Type
                              </span>
                              <Segmented<PrintType>
                                value={item.printType}
                                onChange={(printType) => patchItem(item.id, { printType })}
                                options={[
                                  {
                                    id: "BW",
                                    label: `B & W (₹${item.paperSize === "A3" ? pricingConfig.a3BwPricePerPage : pricingConfig.bwPricePerPage}/pg)`,
                                  },
                                  {
                                    id: "COLOR",
                                    label: `Color (₹${item.paperSize === "A3" ? pricingConfig.a3ColorPricePerPage : pricingConfig.colorPricePerPage}/pg)`,
                                  },
                                ]}
                              />
                            </div>
                            <div className="space-y-2">
                              <span className="text-xs font-bold text-flame-ink">Sides</span>
                              <Segmented<DuplexMode>
                                value={item.duplexMode}
                                onChange={(duplexMode) =>
                                  patchItem(item.id, { duplexMode })
                                }
                                options={[
                                  { id: "SINGLE", label: "Single" },
                                  { id: "DUPLEX", label: "Duplex" },
                                ]}
                              />
                            </div>
                            <div className="space-y-2">
                              <span className="text-xs font-bold text-flame-ink">Copies</span>
                              <div className="flex items-center bg-flame-paper p-1.5 rounded-2xl border border-flame-blue/10 justify-between">
                                <button
                                  type="button"
                                  onClick={() =>
                                    patchItem(item.id, {
                                      copyCount: Math.max(1, item.copyCount - 1),
                                    })
                                  }
                                  className="min-h-11 min-w-11 rounded-xl bg-flame-ivory text-flame-ink border border-flame-blue/10 font-bold"
                                >
                                  -
                                </button>
                                <span className="font-extrabold text-flame-ink text-sm px-2">
                                  {item.copyCount}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    patchItem(item.id, { copyCount: item.copyCount + 1 })
                                  }
                                  className="min-h-11 min-w-11 rounded-xl bg-flame-ivory text-flame-ink border border-flame-blue/10 font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                              <span className="text-xs font-bold text-flame-ink">
                                Page Range
                              </span>
                              <input
                                type="text"
                                placeholder="e.g. All, 1-5, 2,4,6-10"
                                value={item.selectedPageRange}
                                onChange={(event) =>
                                  patchItem(item.id, {
                                    selectedPageRange: event.target.value,
                                  })
                                }
                                className={inputClass}
                              />
                            </div>
                            <div className="space-y-2 sm:col-span-2">
                              <span className="text-xs font-bold text-flame-ink">
                                Orientation
                              </span>
                              <Segmented<Orientation>
                                value={item.orientation}
                                onChange={(orientation) =>
                                  patchItem(item.id, { orientation })
                                }
                                options={[
                                  { id: "PORTRAIT", label: "Portrait" },
                                  { id: "LANDSCAPE", label: "Landscape" },
                                ]}
                              />
                            </div>
                          </div>
                        )}
                        {!item.detectingPages && (
                          <div className="mt-4 pt-4 border-t border-flame-blue/10 flex justify-between items-center gap-3">
                            <span className="text-xs text-flame-muted font-medium flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Auto-detected exactly {item.pageCount} pages.
                            </span>
                            <span className="text-xs font-bold text-flame-ink">
                              Item Cost:{" "}
                              <span className="text-flame-orange">
                                ₹{item.totalCost.toFixed(2)}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {items.length > 0 && (
        <div className="bg-flame-blue text-white rounded-2xl p-5 sm:p-8 shadow-module">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-6">
            <div className="text-center sm:text-left">
              <h3 className="font-display text-lg font-bold mb-1">Batch Order Summary</h3>
              <p className="text-xs text-white/70 font-medium">
                {items.length} document(s) • {impressions} total impressions
              </p>
            </div>
            <div className="text-center sm:text-right p-4 rounded-2xl bg-white/10 border border-white/15 min-w-[200px]">
              <span className="text-[10px] uppercase tracking-widest text-flame-gold font-bold block mb-1">
                Grand Total
              </span>
              <span className="text-4xl font-black">
                {allExempt ? "₹0.00" : `₹${grandTotal.toFixed(2)}`}
              </span>
              {allExempt && (
                <span className="text-[10px] font-bold text-flame-gold block mt-1 uppercase">
                  100% Exempt
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-white/80 bg-black/15 p-3 rounded-xl border border-white/10 mb-6 font-medium">
            <FileText className="w-4 h-4 text-flame-gold flex-shrink-0" />
            <span>
              All files automatically save directly to Reprographics Google Drive folder:{" "}
              <span className="font-mono text-flame-gold font-bold">
                {pricingConfig.gdriveFolderName}
              </span>
            </span>
          </div>
          <Button
            type="button"
            onClick={submit}
            disabled={submitting || items.some((item) => item.detectingPages)}
            variant="accent"
            className="w-full py-4 text-sm"
          >
            {submitting ? (
              <span className="flex items-center gap-3">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Uploading {progress?.current} of {progress?.total}...
              </span>
            ) : allExempt ? (
              <>
                Submit Batch Order (Direct ₹0.00 Queue)
                <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Proceed to UPI Checkout (₹{grandTotal.toFixed(2)})
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
