"use client";

import { Modal } from "@/components/ui/modal";
import type { LoginResult, PricingConfig } from "@/types";
import { GoogleLogin, GoogleOAuthProvider } from "@react-oauth/google";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { jwtDecode } from "jwt-decode";
import { useState } from "react";

interface GoogleJwt {
  email: string;
  name?: string;
}

interface GoogleSSOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, name: string) => LoginResult;
  pricingConfig: PricingConfig;
}

export function GoogleSSOModal({
  isOpen,
  onClose,
  onLogin,
  pricingConfig,
}: GoogleSSOModalProps) {
  const [error, setError] = useState<string | null>(null);
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Google Single Sign-On"
      subtitle="Organizational Account Verification"
      icon={
        <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center p-2">
          <GoogleMark />
        </div>
      }
    >
      <div className="p-6 space-y-5">
        <div className="p-3.5 rounded-2xl bg-flame-blue/5 border border-flame-blue/15 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-flame-blue flex-shrink-0 mt-0.5" />
          <div className="text-xs text-flame-ink">
            <span className="font-bold">Domain Restriction Active: </span>
            Access is restricted to verified email domains:{" "}
            <span className="font-mono text-flame-blue font-bold">
              {pricingConfig.allowedDomains.map((d) => "@" + d).join(", ")}
            </span>
          </div>
        </div>
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-rose-800 font-medium">{error}</div>
          </div>
        )}
        <div className="pt-2 flex justify-center w-full">
          {clientId ? (
            <GoogleOAuthProvider clientId={clientId}>
              <GoogleLogin
                onSuccess={(response) => {
                  setError(null);
                  if (!response.credential) {
                    setError("Login failed. No credential received.");
                    return;
                  }
                  try {
                    const decoded = jwtDecode<GoogleJwt>(response.credential);
                    const email = decoded.email;
                    const name = decoded.name || email.split("@")[0];
                    const result = onLogin(email, name);
                    if (result.success) onClose();
                    else setError(result.message);
                  } catch {
                    setError("Failed to verify Google Sign-In token.");
                  }
                }}
                onError={() => setError("Google Sign-In failed.")}
                useOneTap
                shape="pill"
                size="large"
                text="signin_with"
              />
            </GoogleOAuthProvider>
          ) : (
            <p className="text-xs text-flame-muted text-center">
              Google Sign-In is not configured. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID.
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function GoogleMark() {
  return (
    <svg className="w-full h-full" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}
