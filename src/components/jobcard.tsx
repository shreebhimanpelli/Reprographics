"use client";

import { RoleBanner } from "@/components/rolebanner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import type { JobStatus, PaymentStatus, PrintJob, UserRole } from "@/types";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Mail,
  Play,
  Printer,
  XCircle,
} from "lucide-react";

interface JobCardProps {
  job: PrintJob;
  currentUserRole: UserRole;
  onUpdateStatus: (
    id: string,
    status: JobStatus,
    paymentStatus?: PaymentStatus,
    notes?: string,
  ) => void;
  onViewReceipt: (job: PrintJob) => void;
  onViewEmailLog: (job: PrintJob) => void;
  onViewDriveFile: (job: PrintJob) => void;
  onComposeEmail?: (job: PrintJob) => void;
}

function PaymentBadge({ status }: { status: PaymentStatus }) {
  switch (status) {
    case "EXEMPT":
      return <Badge tone="emerald">Faculty/Staff Exempt</Badge>;
    case "VERIFIED":
      return <Badge tone="blue">UPI Verified</Badge>;
    case "PAYMENT_SUBMITTED":
      return <Badge tone="amber">UTR Submitted</Badge>;
    case "PENDING_PAYMENT":
      return <Badge tone="rose">Pending UPI</Badge>;
    default:
      return null;
  }
}

export function JobStatusBadge({ status }: { status: JobStatus }) {
  switch (status) {
    case "QUEUED":
      return (
        <Badge tone="amber" className="normal-case tracking-normal">
          <Clock className="w-3.5 h-3.5 animate-pulse" /> Queued
        </Badge>
      );
    case "PRINTING":
    case "IN_PROGRESS":
      return (
        <Badge tone="blue" className="normal-case tracking-normal">
          <Printer className="w-3.5 h-3.5 animate-spin" /> In Progress
        </Badge>
      );
    case "READY_FOR_PICKUP":
      return (
        <Badge tone="emerald" className="normal-case tracking-normal">
          <CheckCircle2 className="w-3.5 h-3.5" /> Ready for Pickup
        </Badge>
      );
    case "COMPLETED":
      return (
        <Badge tone="muted" className="normal-case tracking-normal">
          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge tone="rose" className="normal-case tracking-normal">
          <XCircle className="w-3.5 h-3.5" /> Cancelled
        </Badge>
      );
    default:
      return null;
  }
}

export function JobCard({
  job,
  currentUserRole,
  onUpdateStatus,
  onViewReceipt,
  onViewEmailLog,
  onViewDriveFile,
  onComposeEmail,
}: JobCardProps) {
  const staff = currentUserRole === "REPRO_STAFF" || currentUserRole === "SUPER_ADMIN";

  return (
    <Card className="p-5 sm:p-6 flex flex-col justify-between gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-flame-blue/10 pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-flame-blue/10 text-flame-blue border border-flame-blue/15 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-extrabold text-flame-blue text-sm bg-flame-ivory px-2.5 py-0.5 rounded-lg border border-flame-blue/10">
                {job.trackingNumber}
              </span>
              <PaymentBadge status={job.paymentStatus} />
            </div>
            <h4 className="font-bold text-flame-ink text-base truncate max-w-sm mt-1">
              {job.fileName}
            </h4>
            <div className="text-xs text-flame-muted flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="flex items-center gap-2 flex-wrap">
                Submitted by <strong className="text-flame-ink">{job.userName}</strong>
                <RoleBanner role={job.userRole} />
              </span>
              <span>•</span>
              <span>{new Date(job.createdAt).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
        <JobStatusBadge status={job.jobStatus} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-flame-ivory p-3.5 rounded-2xl border border-flame-blue/10 text-xs">
        <div>
          <span className="text-[10px] uppercase font-bold text-flame-muted block">
            Size & Type
          </span>
          <span className="font-bold text-flame-ink">
            {job.paperSize === "A3" ? "A3" : "A4"} •{" "}
            {job.printType === "COLOR" ? "🎨 Color" : "📄 B & W"}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-flame-muted block">
            Pages & Copies
          </span>
          <span className="font-bold text-flame-ink">
            {job.effectivePages} pg ({job.selectedPageRange}) × {job.copyCount} copy
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-flame-muted block">
            Sides
          </span>
          <span className="font-bold text-flame-ink">
            {job.duplexMode === "DUPLEX" ? "Double-Sided" : "Single-Sided"}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase font-bold text-flame-muted block">
            Total Billed
          </span>
          <span className="font-extrabold text-flame-orange text-sm">
            {job.paymentStatus === "EXEMPT" ? "₹0.00" : `₹${job.totalAmount.toFixed(2)}`}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs border-t border-b border-flame-blue/10 py-3">
        <button
          type="button"
          onClick={() => onViewDriveFile(job)}
          className="flex items-center gap-2 min-h-11 text-flame-blue hover:text-flame-blue-deep bg-flame-blue/5 hover:bg-flame-blue/10 px-3 rounded-xl border border-flame-blue/15 font-semibold"
        >
          <ExternalLink className="w-4 h-4" />
          View File in Reprographics Google Drive
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          {job.utrReferenceNumber && (
            <span className="font-mono text-flame-ink bg-flame-ivory px-2.5 py-1 rounded-lg border border-flame-blue/10 text-[11px]">
              UTR: {job.utrReferenceNumber}
            </span>
          )}
          {job.paymentReceiptUrl && (
            <button
              type="button"
              onClick={() => onViewReceipt(job)}
              className="flex items-center gap-1.5 min-h-11 text-flame-orange bg-flame-orange/10 px-2.5 rounded-lg border border-flame-orange/20 text-xs font-semibold"
            >
              Receipt
            </button>
          )}
          {job.notificationSentAt && (
            <button
              type="button"
              onClick={() => onViewEmailLog(job)}
              className="flex items-center gap-1.5 min-h-11 text-emerald-700 bg-emerald-50 px-2.5 rounded-lg border border-emerald-200 text-xs font-semibold"
            >
              <Mail className="w-3.5 h-3.5" />
              Email Sent
            </button>
          )}
        </div>
      </div>

      {staff && (
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            {job.paymentStatus === "PAYMENT_SUBMITTED" && (
              <button
                type="button"
                onClick={() =>
                  onUpdateStatus(job.id, "QUEUED", "VERIFIED", "Payment verified by staff.")
                }
                className={cn(
                  "px-3.5 min-h-11 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5",
                )}
              >
                <CheckCircle2 className="w-4 h-4" />
                Verify Payment
              </button>
            )}
            {job.jobStatus === "QUEUED" && (
              <button
                type="button"
                onClick={() => onUpdateStatus(job.id, "IN_PROGRESS", job.paymentStatus)}
                className="px-3.5 min-h-11 rounded-xl bg-flame-blue hover:bg-flame-blue-deep text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Play className="w-4 h-4 fill-current" />
                Start Printing
              </button>
            )}
            {job.jobStatus === "IN_PROGRESS" && (
              <button
                type="button"
                onClick={() =>
                  onUpdateStatus(job.id, "READY_FOR_PICKUP", job.paymentStatus)
                }
                className="px-3.5 min-h-11 rounded-xl bg-flame-orange text-white font-bold text-xs flex items-center gap-1.5"
              >
                <Mail className="w-4 h-4" />
                Mark Ready for Pickup & Notify Email
              </button>
            )}
            {job.jobStatus === "READY_FOR_PICKUP" && (
              <button
                type="button"
                onClick={() => onUpdateStatus(job.id, "COMPLETED", job.paymentStatus)}
                className="px-3.5 min-h-11 rounded-xl bg-flame-blue-deep text-white font-bold text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-flame-gold" />
                Mark Handed Over / Completed
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onComposeEmail && (
              <button
                type="button"
                onClick={() => onComposeEmail(job)}
                className="px-3 min-h-11 rounded-xl bg-flame-blue/5 text-flame-blue text-xs font-semibold border border-flame-blue/20 flex items-center gap-1.5"
                title="Send notification email from reprographics@flame.edu.in"
              >
                <Mail className="w-3.5 h-3.5" />
                Send Email
              </button>
            )}
            {job.jobStatus !== "CANCELLED" && job.jobStatus !== "COMPLETED" && (
              <button
                type="button"
                onClick={() => onUpdateStatus(job.id, "CANCELLED", job.paymentStatus)}
                className="px-3 min-h-11 rounded-xl bg-rose-50 text-rose-600 text-xs font-semibold border border-rose-200"
              >
                Cancel Job
              </button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
