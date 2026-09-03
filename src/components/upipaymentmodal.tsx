"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { PricingConfig, PrintJob, User } from "@/types";
import {
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  QrCode,
  Smartphone,
} from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";

interface UpiPaymentModalProps {
  jobs: PrintJob[];
  pricingConfig: PricingConfig;
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (jobs: PrintJob[]) => void;
}

function isMobileDevice() {
  if (typeof window === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Android|iPhone|iPad|iPod|webOS|Mobile/i.test(ua);
}

function openUpiApp(url: string) {
  const link = document.createElement("a");
  link.href = url;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function UpiPaymentModal({
  jobs,
  pricingConfig,
  currentUser,
  isOpen,
  onClose,
  onPaymentSuccess,
}: UpiPaymentModalProps) {
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const [gatewayOrderId, setGatewayOrderId] = useState<string | null>(null);
  const [upiIntentUrl, setUpiIntentUrl] = useState("");
  const [gatewayStatus, setGatewayStatus] = useState("");
  const [gatewayError, setGatewayError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const launchedRef = useRef("");
  const jobKey = jobs.map((job) => job.id).join(",");

  const total = jobs.reduce((sum, job) => sum + job.totalAmount, 0);
  const tracking = jobs.length > 0 ? jobs[0].trackingNumber : "";
  const impressions = jobs.reduce(
    (sum, job) => sum + job.effectivePages * job.copyCount,
    0,
  );

  const statusLabel = useMemo(() => {
    if (gatewayStatus === "CHARGED") return "Payment confirmed";
    if (waitingForPayment && isMobile) return "Complete payment in your UPI app…";
    if (waitingForPayment) return "Waiting for UPI confirmation…";
    if (gatewayError) return "Could not start payment";
    return "Preparing UPI checkout…";
  }, [gatewayError, gatewayStatus, isMobile, waitingForPayment]);

  useEffect(() => {
    setIsMobile(isMobileDevice());
  }, []);

  useEffect(() => {
    if (!isOpen || !isMobile || !upiIntentUrl) return;
    if (launchedRef.current === upiIntentUrl) return;
    launchedRef.current = upiIntentUrl;
    const timer = window.setTimeout(() => openUpiApp(upiIntentUrl), 400);
    return () => window.clearTimeout(timer);
  }, [isOpen, isMobile, upiIntentUrl]);

  useEffect(() => {
    if (!isOpen || jobs.length === 0) return;

    let cancelled = false;
    launchedRef.current = "";
    setGatewayOrderId(null);
    setUpiIntentUrl("");
    setGatewayStatus("");
    setGatewayError(null);
    setWaitingForPayment(false);
    setQr("");

    (async () => {
      try {
        const response = await fetch("/api/payments/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            jobIds: jobs.map((job) => job.id),
            jobs,
            userId: currentUser.id,
            userEmail: currentUser.email,
            userPhone: currentUser.phone,
            trackingNumber: tracking,
            amount: total,
            upiVpa: pricingConfig.upiVpa,
            upiPayeeName: pricingConfig.upiPayeeName,
          }),
        });

        const data = await response.json();
        if (cancelled) return;

        if (!response.ok) {
          throw new Error(data.error || "Failed to start UPI payment.");
        }

        const intentUrl = data.upiIntentUrl as string;
        setGatewayOrderId(data.orderId);
        setUpiIntentUrl(intentUrl || "");
        setGatewayStatus(data.status || "PENDING_VBV");
        setWaitingForPayment(true);

        if (intentUrl && !isMobileDevice()) {
          const qrDataUrl = await QRCode.toDataURL(intentUrl, {
            width: 280,
            margin: 2,
            color: { dark: "#0A456F", light: "#ffffff" },
          });
          if (!cancelled) setQr(qrDataUrl);
        }
      } catch (error) {
        if (!cancelled) {
          setGatewayError(
            error instanceof Error ? error.message : "Payment setup failed.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, jobKey, currentUser, tracking, total, pricingConfig]);

  useEffect(() => {
    if (!isOpen || !gatewayOrderId || !waitingForPayment) return;

    let cancelled = false;

    const checkStatus = async () => {
      try {
        const response = await fetch(
          `/api/payments/status?orderId=${encodeURIComponent(gatewayOrderId)}`,
        );
        const data = await response.json();
        if (cancelled) return;
        setGatewayStatus(data.status || "PENDING");

        if (data.status === "CHARGED") {
          setWaitingForPayment(false);
          onPaymentSuccess(data.jobs?.length ? data.jobs : jobs);
          onClose();
        }
      } catch (error) {
        console.error("Payment status poll failed:", error);
      }
    };

    checkStatus();
    const poll = window.setInterval(checkStatus, 2000);
    const onVisible = () => {
      if (document.visibilityState === "visible") checkStatus();
    };
    window.addEventListener("focus", checkStatus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
      window.removeEventListener("focus", checkStatus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [gatewayOrderId, isOpen, jobs, onClose, onPaymentSuccess, waitingForPayment]);

  if (!isOpen || jobs.length === 0) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Pay with UPI"
      subtitle={
        <>
          Tracking ID:{" "}
          <span className="font-mono font-bold text-flame-gold">{tracking}</span>
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

        <div className="rounded-2xl border border-flame-blue/10 bg-flame-ivory px-4 py-3 flex items-center gap-3">
          {waitingForPayment ? (
            <Loader2 className="w-4 h-4 text-flame-orange animate-spin flex-shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-flame-blue flex-shrink-0" />
          )}
          <div>
            <p className="text-xs font-bold text-flame-ink">{statusLabel}</p>
            {gatewayOrderId && (
              <p className="text-[11px] text-flame-muted font-mono mt-0.5">
                Order: {gatewayOrderId}
              </p>
            )}
          </div>
        </div>

        {gatewayError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-800">
            {gatewayError}
          </div>
        )}

        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-flame-blue/10 border border-flame-blue/15 rounded-full mx-auto">
            <div className="w-2 h-2 rounded-full bg-flame-orange animate-pulse" />
            <span className="text-xs font-extrabold text-flame-blue tracking-wide">
              {isMobile ? "Redirecting to UPI" : "Scan QR to pay"}
            </span>
          </div>

          {!isMobile && (
            <div className="bg-white p-3 rounded-3xl inline-block shadow-sm border-4 border-flame-gold/40 relative max-w-[280px]">
              {qr ? (
                <div>
                  <img
                    src={qr}
                    alt="UPI QR Code"
                    className="w-56 h-56 mx-auto rounded-xl"
                  />
                  <div className="mt-1.5 space-y-0.5">
                    <p className="text-[11px] font-extrabold text-flame-blue">
                      FLAME UNIVERSITY PUNE
                    </p>
                    <div className="text-[10px] font-extrabold text-flame-ink bg-flame-gold/30 py-1 rounded-lg">
                      Scan with GPay / PhonePe / Paytm
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-56 h-56 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-flame-blue/20 border-t-flame-orange rounded-full animate-spin" />
                </div>
              )}
            </div>
          )}

          {upiIntentUrl && isMobile && (
            <Button
              variant="accent"
              className="w-full"
              onClick={() => openUpiApp(upiIntentUrl)}
            >
              <Smartphone className="w-4 h-4" />
              Open UPI app
              <ExternalLink className="w-4 h-4" />
            </Button>
          )}

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
            <span className="text-[11px] font-bold text-emerald-700">Amount:</span>
            <span className="text-sm font-black text-flame-ink">₹{total.toFixed(2)}</span>
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

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800">
          {isMobile
            ? "Pay in your UPI app, then return here. This screen confirms payment automatically — no UTR or screenshot."
            : "Scan the QR and pay. This screen confirms payment automatically — no UTR or screenshot."}
        </div>
      </div>
    </Modal>
  );
}
