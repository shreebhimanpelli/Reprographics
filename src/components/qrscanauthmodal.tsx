"use client";

import { GoogleMark } from "@/components/googlessomodal";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import type { PricingConfig, User } from "@/types";
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CheckCircle2,
  File,
  LogIn,
  QrCode,
  RotateCcw,
  Shield,
} from "lucide-react";
import { useEffect, useState } from "react";

interface QRScanAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  pricingConfig: PricingConfig;
  onOpenGoogleSSO: () => void;
  onProceedToPrint: () => void;
}

type ScanState = "IDLE" | "SCANNING" | "SCANNED_SUCCESS";

export function QRScanAuthModal({
  isOpen,
  onClose,
  currentUser,
  onOpenGoogleSSO,
  onProceedToPrint,
}: QRScanAuthModalProps) {
  const [state, setState] = useState<ScanState>("IDLE");
  const [scannedAt, setScannedAt] = useState("");

  useEffect(() => {
    if (isOpen) {
      setState("IDLE");
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const scan = () => {
    setState("SCANNING");
    setTimeout(() => {
      setState("SCANNED_SUCCESS");
      setScannedAt(new Date().toLocaleTimeString());
    }, 1200);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Station QR Code Scanner"
      subtitle="Google SSO Authentication & Database Authorization"
      icon={
        <div className="w-10 h-10 rounded-2xl bg-white/10 text-flame-gold border border-white/20 flex items-center justify-center">
          <QrCode className="w-5 h-5" />
        </div>
      }
    >
      <div className="p-6 space-y-6">
        <div className="relative rounded-2xl border border-flame-blue/10 bg-flame-ivory p-6 text-center overflow-hidden">
          {state === "IDLE" && (
            <div className="py-6 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-flame-blue/10 border-2 border-dashed border-flame-orange/40 flex items-center justify-center">
                <QrCode className="w-10 h-10 text-flame-blue" />
              </div>
              <div>
                <h4 className="font-bold text-flame-ink text-sm">
                  Scan Reprographics Kiosk QR
                </h4>
                <p className="text-xs text-flame-muted mt-1 max-w-xs mx-auto">
                  Scanning authenticates your identity via Google SSO and validates your
                  active user profile in the database.
                </p>
              </div>
              <Button onClick={scan} className="mx-auto">
                <Camera className="w-4 h-4" />
                Activate Camera & Scan
              </Button>
            </div>
          )}
          {state === "SCANNING" && (
            <div className="py-8 space-y-4">
              <div className="w-40 h-40 mx-auto rounded-2xl border-2 border-flame-orange relative flex items-center justify-center bg-flame-paper overflow-hidden">
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-flame-orange to-transparent animate-bounce" />
                <QrCode className="w-16 h-16 text-flame-blue/30" />
              </div>
              <p className="text-xs font-semibold text-flame-orange animate-pulse">
                Scanning Kiosk QR & Verifying Database Permissions...
              </p>
            </div>
          )}
          {state === "SCANNED_SUCCESS" && (
            <div className="py-4 space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  Station Code Validated at {scannedAt}
                </span>
                <h4 className="font-extrabold text-flame-ink text-base mt-2">
                  Kiosk QR Scan Verified!
                </h4>
              </div>
            </div>
          )}
        </div>

        <div className="bg-flame-ivory p-4 rounded-2xl border border-flame-blue/10 space-y-3">
          <div className="flex items-center justify-between text-xs border-b border-flame-blue/10 pb-2 gap-2">
            <span className="font-bold text-flame-muted flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-flame-blue" />
              Step 1: Google SSO & DB Verification
            </span>
            {currentUser ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Authenticated & Active
              </span>
            ) : (
              <span className="text-amber-700 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> SSO Required First
              </span>
            )}
          </div>
          {currentUser ? (
            <div className="flex items-center gap-3 pt-1">
              <img
                src={
                  currentUser.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`
                }
                alt={currentUser.name}
                className="w-10 h-10 rounded-xl object-cover ring-2 ring-flame-gold/40"
              />
              <div className="flex-1 min-w-0">
                <h5 className="font-bold text-flame-ink text-xs truncate">
                  {currentUser.name}
                </h5>
                <p className="text-[11px] text-flame-muted truncate">{currentUser.email}</p>
                <p className="text-[10px] text-flame-blue font-mono font-bold mt-0.5">
                  Role: {currentUser.role} • Status: {currentUser.status}
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenGoogleSSO}
                className="text-[11px] font-bold text-flame-orange hover:underline"
              >
                Change SSO Account
              </button>
            </div>
          ) : (
            <div className="py-2 space-y-2">
              <p className="text-xs text-flame-ink font-semibold">
                First authenticate with your Google SSO account to verify your active role
                in the database:
              </p>
              <button
                type="button"
                onClick={onOpenGoogleSSO}
                className="w-full min-h-11 p-3 rounded-xl bg-flame-paper hover:bg-flame-gold/15 border border-flame-blue/10 flex items-center gap-3 text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-white border border-flame-blue/10 flex items-center justify-center p-1">
                  <GoogleMark />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-flame-ink block">
                    Sign in with Google SSO First
                  </span>
                  <span className="text-[10px] text-flame-muted block font-mono">
                    Verifies against User Database before opening Print Request
                  </span>
                </div>
                <LogIn className="w-4 h-4 text-flame-muted" />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {currentUser ? (
            <Button
              variant="accent"
              className="w-full"
              onClick={() => {
                onClose();
                onProceedToPrint();
              }}
            >
              <File className="w-4 h-4" />
              Validated! Proceed to Put Print Request
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button className="w-full" onClick={onOpenGoogleSSO}>
              <LogIn className="w-4 h-4" />
              Authenticate via Google SSO First
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
          {state === "SCANNED_SUCCESS" && (
            <button
              type="button"
              onClick={() => setState("IDLE")}
              className="w-full min-h-11 py-2 text-xs font-medium text-flame-muted hover:text-flame-ink flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Rescan Another QR Code
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
