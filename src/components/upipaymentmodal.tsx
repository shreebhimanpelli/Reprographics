"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { inputClass } from "@/components/ui/field";
import type { PricingConfig, PrintJob } from "@/types";
import { BarChart3, CheckCircle2, Copy, Image as ImageIcon, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface UpiPaymentModalProps {
  jobs: PrintJob[];
  pricingConfig: PricingConfig;
  isOpen: boolean;
  onClose: () => void;
  onSubmitUTR: (ids: string[], utr: string, receiptUrl?: string) => void;
}

export function UpiPaymentModal({
  jobs,
  pricingConfig,
  isOpen,
  onClose,
  onSubmitUTR,
}: UpiPaymentModalProps) {
  const [utr, setUtr] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState<string | undefined>();
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const [demoFilled, setDemoFilled] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const total = jobs.reduce((sum, job) => sum + job.totalAmount, 0);
  const tracking = jobs.length > 0 ? jobs[0].trackingNumber : "";
  const impressions = jobs.reduce(
    (sum, job) => sum + job.effectivePages * job.copyCount,
    0,
  );

  useEffect(() => {
    if (jobs.length > 0 && isOpen) {
      const uri = `upi://pay?pa=${pricingConfig.upiVpa}&pn=${encodeURIComponent(pricingConfig.upiPayeeName)}&am=${total.toFixed(2)}&cu=INR`;
      QRCode.toDataURL(uri, {
        width: 280,
        margin: 2,
        color: { dark: "#0A456F", light: "#ffffff" },
      })
        .then(setQr)
        .catch((error) => console.error("Error generating QR:", error));
    }
  }, [jobs, isOpen, pricingConfig, total]);

  if (!isOpen || jobs.length === 0) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="HDFC PayZapp Payment"
      subtitle={
        <>
          Tracking ID: <span className="font-mono font-bold text-flame-gold">{tracking}</span>
        </>
      }
      icon={
        <div className="w-10 h-10 rounded-xl bg-white/10 text-flame-gold border border-white/20 flex items-center justify-center">
          <QrCode className="w-5 h-5" />
        </div>
      }
    >
      <div className="p-5 space-y-6">
        <div className="p-4 rounded-2xl bg-flame-blue/5 border border-flame-blue/15 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-flame-blue block">
              Total Amount Due
            </span>
            <span className="text-2xl font-black text-flame-ink">₹{total.toFixed(2)}</span>
          </div>
          <div className="text-right text-xs text-flame-muted">
            <div>
              {jobs.length} Document{jobs.length > 1 ? "s" : ""}
            </div>
            <div className="font-semibold text-flame-orange">
              {impressions} Total Impressions
            </div>
          </div>
        </div>

        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-flame-blue/10 border border-flame-blue/15 rounded-full mx-auto">
            <div className="w-2 h-2 rounded-full bg-flame-orange animate-pulse" />
            <span className="text-xs font-extrabold text-flame-blue tracking-wide">
              HDFC PayZapp • Dynamic QR
            </span>
          </div>
          <div className="bg-white p-3 rounded-3xl inline-block shadow-sm border-4 border-flame-gold/40 relative max-w-[280px]">
            {qr ? (
              <div>
                <img
                  src={qr}
                  alt="HDFC PayZapp Dynamic QR Code"
                  className="w-56 h-56 mx-auto rounded-xl"
                />
                <div className="mt-1.5 space-y-0.5">
                  <p className="text-[11px] font-extrabold text-flame-blue">
                    FLAME UNIVERSITY PUNE
                  </p>
                  <div className="text-[10px] font-extrabold text-flame-ink bg-flame-gold/30 py-1 rounded-lg">
                    PayZapp @ HDFC BANK • TID NO. 65015664
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-56 h-56 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-flame-blue/20 border-t-flame-orange rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
            <span className="text-[11px] font-bold text-emerald-700">Amount Embedded:</span>
            <span className="text-sm font-black text-flame-ink">₹{total.toFixed(2)}</span>
          </div>
          <div className="text-[11px] text-flame-muted font-semibold">
            Scan & Pay via:{" "}
            <span className="font-mono text-flame-blue">
              GPay • PhonePe • PayZapp • Paytm • Amazon Pay
            </span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs flex-wrap">
            <span className="text-flame-muted">UPI ID:</span>
            <span className="font-mono text-flame-ink font-bold bg-flame-ivory px-2.5 py-1 rounded-lg border border-flame-blue/10 text-[11px]">
              {pricingConfig.upiVpa}
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(pricingConfig.upiVpa);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="p-2 min-h-11 min-w-11 rounded-lg bg-flame-ivory hover:bg-flame-gold/20 text-flame-blue"
              title="Copy UPI VPA"
            >
              {copied ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
              ) : (
                <Copy className="w-4 h-4 mx-auto" />
              )}
            </button>
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!utr.trim()) return;
            setSubmitting(true);
            setTimeout(() => {
              const fallback =
                receiptUrl ||
                "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&auto=format&fit=crop&q=80";
              onSubmitUTR(
                jobs.map((job) => job.id),
                utr.trim(),
                fallback,
              );
              setSubmitting(false);
              onClose();
            }, 700);
          }}
          className="space-y-4 border-t border-flame-blue/10 pt-5"
        >
          <div>
            <div className="flex items-center justify-between mb-1.5 gap-2">
              <label className="text-xs font-bold text-flame-ink">
                Transaction Reference / UTR Number <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setUtr(`UPI/${Math.floor(1e11 + 9e11 * Math.random())}`);
                  setDemoFilled(true);
                  setTimeout(() => setDemoFilled(false), 2000);
                }}
                className="text-[11px] text-flame-orange hover:underline flex items-center gap-1 font-semibold"
              >
                <BarChart3 className="w-3 h-3" />
                {demoFilled ? "UTR Generated!" : "Auto-fill Demo UTR"}
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="e.g. 123456789012 or UPI/40982310"
              value={utr}
              onChange={(event) => setUtr(event.target.value)}
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-flame-ink mb-1.5">
              Upload Payment Confirmation Screenshot (Optional)
            </label>
            {receiptUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-flame-blue/10 bg-flame-ivory p-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img
                    src={receiptUrl}
                    alt="Receipt"
                    className="w-12 h-12 object-cover rounded-xl border border-flame-blue/10"
                  />
                  <div>
                    <span className="text-xs font-semibold text-flame-ink block">
                      Receipt Attached
                    </span>
                    <span className="text-[10px] text-flame-muted">
                      {receiptFile?.name || "payment_confirmation.png"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReceiptFile(null);
                    setReceiptUrl(undefined);
                  }}
                  className="px-2.5 py-1 min-h-11 bg-flame-paper border border-flame-blue/10 text-xs text-flame-muted rounded-lg"
                >
                  Remove
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-4 border border-dashed border-flame-blue/20 hover:border-flame-orange bg-flame-ivory rounded-2xl cursor-pointer">
                <ImageIcon className="w-6 h-6 text-flame-muted mb-1" />
                <span className="text-xs text-flame-muted">
                  Click to attach screenshot receipt
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    if (event.target.files?.[0]) {
                      const file = event.target.files[0];
                      setReceiptFile(file);
                      const reader = new FileReader();
                      reader.onload = () => setReceiptUrl(String(reader.result));
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
            )}
          </div>
          <Button
            type="submit"
            disabled={submitting || !utr.trim()}
            variant="accent"
            className="w-full"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Submit Payment & Enter Queue
              </>
            )}
          </Button>
        </form>
      </div>
    </Modal>
  );
}
