"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { inputClass } from "@/components/ui/field";
import type { EmailLog, PrintJob } from "@/types";
import { BarChart3, CheckCircle2, Mail, Send } from "lucide-react";
import { useEffect, useState } from "react";

interface EmailNotificationModalProps {
  log: EmailLog | null;
  job: PrintJob | null;
  isOpen: boolean;
  onClose: () => void;
  onSendEmail?: (job: PrintJob, subject: string, body: string) => void;
}

export function EmailNotificationModal({
  log,
  job,
  isOpen,
  onClose,
  onSendEmail,
}: EmailNotificationModalProps) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (log) {
      setSubject(log.subject);
      setBody(log.body);
    } else if (job) {
      setSubject(`🎉 Your Print Job [${job.trackingNumber}] Status Update`);
      setBody(
        `Dear ${job.userName},\n\nYour print job "${job.fileName}" (Tracking ID: ${job.trackingNumber}) is currently: ${job.jobStatus.replace(/_/g, " ")}.\n\n📍 Pickup Location: Main Reprographics Center, Admin Block, Ground Floor\n⏰ Pickup Hours: Monday - Saturday (8:30 AM - 7:00 PM)\n📄 Details: ${job.effectivePages} pg(s) × ${job.copyCount} copy(ies) [${job.printType === "COLOR" ? "Color" : "Black & White"}]\n💰 Total Billed: ₹${job.totalAmount.toFixed(2)}\n\nPlease contact reprographics@flame.edu.in if you have any questions.\n\nBest regards,\nFLAME University Reprographics Team`,
      );
    }
    setSent(false);
  }, [log, job, isOpen]);

  if (!isOpen) return null;

  const sender = log?.senderEmail || "reprographics@flame.edu.in";
  const recipient = log?.recipientEmail || job?.userEmail || "";
  const composing = !log && !!job;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={composing ? "Send Email Notification" : "Email Dispatch Log"}
      subtitle={
        <>
          From: <span className="font-mono font-semibold text-flame-gold">{sender}</span>
        </>
      }
      icon={
        <div className="w-9 h-9 rounded-xl bg-white/10 text-flame-gold border border-white/20 flex items-center justify-center">
          <Mail className="w-5 h-5" />
        </div>
      }
    >
      <div className="p-6 space-y-4">
        {sent ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-extrabold text-flame-ink">
              Email Notification Dispatched!
            </h4>
            <p className="text-xs text-flame-muted">
              Sent to <span className="text-flame-ink font-semibold">{recipient}</span> from{" "}
              <span className="text-flame-blue font-mono">reprographics@flame.edu.in</span>.
            </p>
          </div>
        ) : composing ? (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (!job || !onSendEmail) return;
              setSending(true);
              setTimeout(() => {
                onSendEmail(job, subject, body);
                setSending(false);
                setSent(true);
                setTimeout(() => onClose(), 1200);
              }, 600);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-flame-muted mb-1">
                Recipient
              </label>
              <input type="email" disabled value={recipient} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-flame-muted mb-1">
                Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-flame-muted mb-1">
                Email Body
              </label>
              <textarea
                rows={6}
                required
                value={body}
                onChange={(event) => setBody(event.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex items-center gap-2 text-[11px] text-flame-blue bg-flame-blue/5 p-3 rounded-xl border border-flame-blue/15">
              <BarChart3 className="w-4 h-4 flex-shrink-0" />
              <span>
                Official Sender Identity:{" "}
                <strong className="font-mono">reprographics@flame.edu.in</strong>
              </span>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={sending} variant="accent">
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Email from reprographics@flame.edu.in
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-flame-ivory p-4 rounded-2xl border border-flame-blue/10 space-y-3">
              <div className="flex items-center justify-between border-b border-flame-blue/10 pb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-flame-muted block">
                    Sender
                  </span>
                  <span className="text-xs font-mono text-flame-blue">{sender}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-flame-muted block">
                    Recipient
                  </span>
                  <span className="text-xs font-mono text-flame-ink">{recipient}</span>
                </div>
              </div>
              <div className="border-b border-flame-blue/10 pb-2">
                <span className="text-[10px] uppercase font-bold text-flame-muted block">
                  Subject
                </span>
                <p className="text-xs font-bold text-flame-blue">{subject}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-flame-muted block mb-1">
                  Message Body
                </span>
                <div className="text-xs text-flame-ink leading-relaxed whitespace-pre-line bg-flame-paper p-3 rounded-xl border border-flame-blue/10">
                  {body}
                </div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-flame-muted pt-1">
                <span>
                  Tracking Ref:{" "}
                  <span className="font-mono text-flame-ink">{log?.trackingNumber}</span>
                </span>
                <span>Dispatched: {log ? new Date(log.sentAt).toLocaleString() : ""}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>
                Verified email dispatch log recorded for reprographics@flame.edu.in.
              </span>
            </div>
            <Button className="w-full" onClick={onClose}>
              Close Log
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
