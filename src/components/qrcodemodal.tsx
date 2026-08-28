"use client";

import { FLAME_LOGO_SRC } from "@/components/brand-mark";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { BarChart3, Check, Copy, Printer, QrCode, Smartphone } from "lucide-react";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  appUrl?: string;
  onOpenQRScanner?: () => void;
}

const PORTAL_URL = "https://flamereprographics.in";

export function QRCodeModal({
  isOpen,
  onClose,
  onOpenQRScanner,
}: QRCodeModalProps) {
  const [qr, setQr] = useState("");
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState("");

  useEffect(() => {
    setUrl(PORTAL_URL);
    QRCode.toDataURL(PORTAL_URL, {
      width: 320,
      margin: 2,
      color: { dark: "#0A456F", light: "#ffffff" },
    })
      .then(setQr)
      .catch((error) => console.error("Error generating QR code:", error));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Portal Access QR Code"
      subtitle="Scan to access document submission portal"
      icon={
        <div className="w-10 h-10 rounded-2xl bg-white/10 text-flame-gold border border-white/20 flex items-center justify-center">
          <QrCode className="w-5 h-5" />
        </div>
      }
    >
      <div className="p-6 text-center space-y-5">
        <div className="inline-flex items-center gap-2 bg-flame-blue/5 text-flame-blue border border-flame-blue/15 px-3.5 py-1.5 rounded-full text-xs font-semibold">
          <Smartphone className="w-4 h-4 text-flame-orange" />
          Mobile Print Submission Portal
        </div>
        <p className="text-xs text-flame-muted max-w-xs mx-auto">
          Students, Faculty, and Staff can scan this QR code using a smartphone camera to
          open the submission portal directly.
        </p>
        <div className="p-4 bg-white rounded-3xl shadow-sm inline-block border border-flame-blue/10">
          <img
            src={FLAME_LOGO_SRC}
            alt="FLAME University"
            className="h-16 w-auto mx-auto mb-3 object-contain"
          />
          {qr ? (
            <img
              src={qr}
              alt="FLAME Reprographics QR Code"
              className="w-56 h-56 mx-auto rounded-xl"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-flame-muted text-xs">
              Generating QR Code...
            </div>
          )}
        </div>
        <div className="bg-flame-ivory p-3 rounded-2xl border border-flame-blue/10 flex items-center justify-between gap-2">
          <span className="font-mono text-xs text-flame-blue truncate font-semibold">
            {url}
          </span>
          <button
            type="button"
            onClick={() => {
              if (navigator.clipboard && url) {
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }
            }}
            className="flex items-center gap-1 min-h-11 bg-flame-blue hover:bg-flame-blue-deep text-white px-3 rounded-xl text-xs font-bold flex-shrink-0"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-flame-gold" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        {onOpenQRScanner && (
          <Button
            variant="accent"
            className="w-full"
            onClick={() => {
              onClose();
              onOpenQRScanner();
            }}
          >
            <BarChart3 className="w-4 h-4" />
            Simulate Scanning & Authenticate via Google SSO
          </Button>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              const popup = window.open("", "_blank");
              if (!popup) return;
              popup.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>FLAME Reprographics - QR Code Poster</title>
          <style>
            body {
              font-family: "Nunito Sans", Avenir, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 40px;
              box-sizing: border-box;
              text-align: center;
              background-color: #F7F3EB;
              color: #122433;
            }
            .card {
              border: 3px solid #0A456F;
              border-radius: 24px;
              padding: 40px;
              max-width: 480px;
              width: 100%;
              background: #FFFCF6;
            }
            .logo-wrap {
              background: #fff;
              display: inline-block;
              padding: 12px 16px;
              border-radius: 16px;
              margin-bottom: 16px;
            }
            .logo-wrap img { width: 120px; height: auto; padding: 0; border: 0; }
            h1 { font-family: Cambria, serif; font-size: 28px; margin: 0 0 12px 0; color: #0A456F; }
            p { font-size: 14px; color: #5C6B7A; margin: 0 0 24px 0; }
            .qr { width: 260px; height: 260px; border-radius: 16px; border: 1px solid #0A456F22; padding: 12px; background: #fff; }
            .url { font-family: monospace; font-size: 14px; font-weight: 700; color: #F58220; margin-top: 20px; }
            .footer { margin-top: 30px; font-size: 12px; color: #5C6B7A; text-transform: uppercase; letter-spacing: 0.05em; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="logo-wrap">
              <img src="${window.location.origin}${FLAME_LOGO_SRC}" alt="FLAME University" />
            </div>
            <h1>Reprographics Print Portal</h1>
            <p>Scan with your phone camera to submit documents for printing (Students, Faculty & Staff)</p>
            <img class="qr" src="${qr}" alt="Reprographics QR Code" />
            <div class="url">${url}</div>
            <div class="footer">Send inquiries & support to: reprographics@flame.edu.in</div>
          </div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
              popup.document.close();
            }}
            className="flex items-center justify-center gap-2 min-h-11 bg-flame-ivory hover:bg-flame-gold/20 text-flame-ink font-bold py-2.5 px-4 rounded-xl text-xs border border-flame-blue/10"
          >
            <Printer className="w-4 h-4 text-flame-blue" />
            Print Poster
          </button>
          <a
            href={qr}
            download="flame-reprographics-qr.png"
            className="flex items-center justify-center gap-2 min-h-11 bg-flame-blue hover:bg-flame-blue-deep text-white font-bold py-2.5 px-4 rounded-xl text-xs"
          >
            <QrCode className="w-4 h-4" />
            Download Image
          </a>
        </div>
      </div>
    </Modal>
  );
}
