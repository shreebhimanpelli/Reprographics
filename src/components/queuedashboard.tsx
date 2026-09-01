"use client";

import { JobCard, JobStatusBadge } from "@/components/jobcard";
import { RoleBanner } from "@/components/rolebanner";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Segmented } from "@/components/ui/segmented";
import { inputClass } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { paperSheetsForJob } from "@/lib/pricecalculator";
import type { JobStatus, PaymentStatus, PrintJob, UserRole } from "@/types";
import {
  CheckCircle2,
  ExternalLink,
  Filter,
  LayoutGrid,
  Mail,
  Printer,
  Search,
  Table as TableIcon,
  XCircle,
} from "lucide-react";
import { useState } from "react";

interface QueueDashboardProps {
  jobs: PrintJob[];
  currentUserRole: UserRole;
  onUpdateStatus: (
    id: string,
    status: JobStatus,
    paymentStatus?: PaymentStatus,
    notes?: string,
  ) => void;
  onDeleteFilePayload?: (id: string) => void;
  onViewReceipt: (job: PrintJob) => void;
  onViewEmailLog: (job: PrintJob) => void;
  onComposeEmail?: (job: PrintJob) => void;
  onPrintJob?: (job: PrintJob) => void;
}

type StatusFilter = "ALL" | JobStatus;
type RoleFilter = "ALL" | UserRole;
type ViewMode = "TABLE" | "CARDS";

export function QueueDashboard({
  jobs,
  currentUserRole,
  onUpdateStatus,
  onDeleteFilePayload,
  onViewReceipt,
  onViewEmailLog,
  onComposeEmail,
  onPrintJob,
}: QueueDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("TABLE");
  const [driveJob, setDriveJob] = useState<PrintJob | null>(null);

  const filtered = jobs.filter((job) => {
    if (statusFilter !== "ALL" && job.jobStatus !== statusFilter) return false;
    if (roleFilter !== "ALL" && job.userRole !== roleFilter) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        job.trackingNumber.toLowerCase().includes(q) ||
        job.userName.toLowerCase().includes(q) ||
        job.userEmail.toLowerCase().includes(q) ||
        job.fileName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const countFor = (status: StatusFilter) =>
    status === "ALL" ? jobs.length : jobs.filter((job) => job.jobStatus === status).length;

  const isStaff = currentUserRole === "REPRO_STAFF" || currentUserRole === "SUPER_ADMIN";
  const roleChip = (role: UserRole) => {
    if (role === "STUDENT") return <Badge tone="blue">Student</Badge>;
    if (role === "FACULTY") return <Badge tone="emerald">Faculty (₹0.00)</Badge>;
    if (role === "STAFF") return <Badge tone="purple">Staff (₹0.00)</Badge>;
    return <RoleBanner role={role} />;
  };

  const actions = (job: PrintJob) =>
    isStaff ? (
      <div className="flex items-center justify-end gap-1.5 flex-wrap">
        {job.paymentStatus === "PAYMENT_SUBMITTED" && (
          <button
            type="button"
            onClick={() =>
              onUpdateStatus(job.id, "QUEUED", "VERIFIED", "Payment verified by staff.")
            }
            className="px-2.5 min-h-11 rounded-lg bg-emerald-600 text-white font-bold text-[11px] flex items-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3" />
            Verify
          </button>
        )}
        {job.jobStatus === "QUEUED" && (
          <button
            type="button"
            onClick={() =>
              onPrintJob ? onPrintJob(job) : onUpdateStatus(job.id, "IN_PROGRESS", job.paymentStatus)
            }
            className="px-2.5 min-h-11 rounded-lg bg-flame-blue text-white font-bold text-[11px] flex items-center gap-1"
          >
            <Printer className="w-3 h-3" />
            Print
          </button>
        )}
        {job.jobStatus === "IN_PROGRESS" && (
          <button
            type="button"
            onClick={() => onUpdateStatus(job.id, "READY_FOR_PICKUP", job.paymentStatus)}
            className="px-2.5 min-h-11 rounded-lg bg-flame-orange text-white font-bold text-[11px] flex items-center gap-1"
          >
            <Mail className="w-3 h-3" />
            Mark Ready & Email
          </button>
        )}
        {job.jobStatus === "READY_FOR_PICKUP" && (
          <button
            type="button"
            onClick={() => onUpdateStatus(job.id, "COMPLETED", job.paymentStatus)}
            className="px-2.5 min-h-11 rounded-lg bg-flame-blue-deep text-white font-bold text-[11px] flex items-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3 text-flame-gold" />
            Handed Over
          </button>
        )}
        {onDeleteFilePayload && !job.isFileDeleted && (
          <button
            type="button"
            onClick={() => onDeleteFilePayload(job.id)}
            className="px-2 min-h-11 rounded-lg bg-flame-ivory text-flame-blue border border-flame-blue/20 font-bold text-[10px]"
            title="Delete heavy document payload to free server storage (Keeps Payment & Transaction History 100% Intact)"
          >
            Clear File (Free Storage)
          </button>
        )}
        {onComposeEmail && (
          <button
            type="button"
            onClick={() => onComposeEmail(job)}
            className="p-2 min-h-11 min-w-11 rounded-lg bg-flame-blue/5 text-flame-blue border border-flame-blue/20"
            title="Send email from reprographics@flame.edu.in"
          >
            <Mail className="w-3.5 h-3.5 mx-auto" />
          </button>
        )}
        {job.jobStatus !== "CANCELLED" && job.jobStatus !== "COMPLETED" && (
          <button
            type="button"
            onClick={() => onUpdateStatus(job.id, "CANCELLED", job.paymentStatus)}
            className="p-2 min-h-11 min-w-11 rounded-lg bg-rose-50 text-rose-600 border border-rose-200"
            title="Cancel Job"
          >
            <XCircle className="w-3.5 h-3.5 mx-auto" />
          </button>
        )}
      </div>
    ) : null;

  const cards = (
    <div className="space-y-4">
      {filtered.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          currentUserRole={currentUserRole}
          onUpdateStatus={onUpdateStatus}
          onViewReceipt={onViewReceipt}
          onViewEmailLog={onViewEmailLog}
          onComposeEmail={onComposeEmail}
          onViewDriveFile={(item) => setDriveJob(item)}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6 space-y-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-flame-blue/10 text-flame-blue border border-flame-blue/15">
                <LayoutGrid className="w-5 h-5" />
              </span>
              <h2 className="font-display text-xl font-bold text-flame-blue tracking-tight">
                Reprographics Queue Grid
              </h2>
            </div>
            <p className="text-xs text-flame-muted mt-1 font-medium">
              Tabular records grid sorted by timestamp. Easily search, filter, verify
              payments, and dispatch pickup emails.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="hidden md:block">
              <Segmented<ViewMode>
                value={view}
                onChange={setView}
                options={[
                  {
                    id: "TABLE",
                    label: (
                      <span className="flex items-center gap-1.5">
                        <TableIcon className="w-3.5 h-3.5" /> Tabular Grid
                      </span>
                    ),
                  },
                  {
                    id: "CARDS",
                    label: (
                      <span className="flex items-center gap-1.5">
                        <LayoutGrid className="w-3.5 h-3.5" /> Cards View
                      </span>
                    ),
                  },
                ]}
              />
            </div>
            <span className="px-3 min-h-11 inline-flex items-center rounded-xl bg-flame-ivory border border-flame-blue/10 text-xs font-mono text-flame-blue font-extrabold">
              {filtered.length} Records
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-flame-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search Tracking ID, Name, Email, File..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className={cn(inputClass, "pl-10")}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-flame-muted flex-shrink-0" />
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
              className={inputClass}
            >
              <option value="ALL">All Roles (Student, Faculty, Staff)</option>
              <option value="STUDENT">Students Only</option>
              <option value="FACULTY">Faculty Only (₹0.00)</option>
              <option value="STAFF">Staff Only (₹0.00)</option>
            </select>
          </div>
          <div className="flex items-center justify-start md:justify-end gap-2 text-xs text-flame-muted">
            <span className="w-2.5 h-2.5 rounded-full bg-flame-gold animate-pulse" />
            <span>{countFor("QUEUED")} Queued</span>
            <span>•</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>{countFor("READY_FOR_PICKUP")} Ready</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-flame-blue/10">
          {(
            [
              { id: "ALL", label: "All Records" },
              { id: "QUEUED", label: "Queued" },
              { id: "IN_PROGRESS", label: "In Progress" },
              { id: "READY_FOR_PICKUP", label: "Ready for Pickup" },
              { id: "COMPLETED", label: "Completed" },
              { id: "CANCELLED", label: "Cancelled" },
            ] as { id: StatusFilter; label: string }[]
          ).map((item) => {
            const active = statusFilter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatusFilter(item.id)}
                className={cn(
                  "px-3.5 min-h-11 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2",
                  active
                    ? "bg-flame-orange text-white shadow-sm"
                    : "bg-flame-ivory text-flame-muted hover:text-flame-ink",
                )}
              >
                <span>{item.label}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded-md text-[10px] font-mono",
                    active ? "bg-white/20 text-white" : "bg-flame-paper text-flame-ink",
                  )}
                >
                  {countFor(item.id)}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center text-flame-muted">
          <LayoutGrid className="w-12 h-12 mx-auto text-flame-blue/30 mb-3" />
          <h3 className="text-base font-bold text-flame-ink mb-1">No print jobs found</h3>
          <p className="text-xs font-medium">
            No active print jobs match the selected filter criteria.
          </p>
        </Card>
      ) : (
        <>
          <div className="md:hidden">{cards}</div>
          <div className="hidden md:block">
            {view === "TABLE" ? (
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-flame-ivory border-b border-flame-blue/10 text-flame-blue uppercase font-extrabold text-[10px] tracking-wider">
                        <th className="py-3.5 px-4">Tracking ID</th>
                        <th className="py-3.5 px-4">Timestamp</th>
                        <th className="py-3.5 px-4">User & Role</th>
                        <th className="py-3.5 px-4">Document Specs</th>
                        <th className="py-3.5 px-4">Amount</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">File / Receipt</th>
                        {isStaff && <th className="py-3.5 px-4 text-right">Workflow Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-flame-blue/10">
                      {filtered.map((job) => (
                        <tr key={job.id} className="hover:bg-flame-ivory/70">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono font-extrabold text-flame-ink bg-flame-ivory px-2 py-0.5 rounded border border-flame-blue/10">
                              {job.trackingNumber}
                            </span>
                            {job.utrReferenceNumber && (
                              <span className="block text-[10px] font-mono text-flame-muted mt-1 truncate max-w-[130px]">
                                UTR: {job.utrReferenceNumber}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-flame-muted text-[11px] font-medium">
                            {new Date(job.createdAt).toLocaleDateString()}
                            <br />
                            <span className="font-mono">
                              {new Date(job.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="font-bold text-flame-ink leading-tight">
                              {job.userName}
                            </div>
                            <div className="text-[10px] text-flame-muted font-mono truncate max-w-[150px]">
                              {job.userEmail}
                            </div>
                            <div className="mt-1">{roleChip(job.userRole)}</div>
                          </td>
                          <td className="py-3 px-4 max-w-xs">
                            <div className="font-bold text-flame-blue truncate">
                              {job.fileName}
                            </div>
                            <div className="text-[11px] text-flame-muted mt-0.5 font-medium">
                              {job.effectivePages} pg ({job.selectedPageRange}) ×{" "}
                              {job.copyCount} copy •{" "}
                              <span className="font-bold text-flame-ink">
                                {job.paperSize === "A3" ? "A3" : "A4"} •{" "}
                                {job.printType === "COLOR" ? "🎨 Color" : "📄 B&W"}
                              </span>{" "}
                              • {job.duplexMode === "DUPLEX" ? "Duplex" : "Single"}
                            </div>
                            <div className="mt-1">
                              <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Stock: {paperSheetsForJob(job)} paper sheet(s)
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-extrabold text-flame-ink text-sm">
                              {job.paymentStatus === "EXEMPT"
                                ? "₹0.00"
                                : `₹${job.totalAmount.toFixed(2)}`}
                            </span>
                            <span className="block text-[10px] font-semibold text-flame-muted">
                              {job.paymentStatus === "EXEMPT"
                                ? "Exempt"
                                : job.paymentStatus.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <JobStatusBadge status={job.jobStatus} />
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              {job.isFileDeleted ? (
                                <span className="text-[10px] font-mono font-bold text-flame-blue bg-flame-ivory px-2 py-0.5 rounded border border-flame-blue/20">
                                  Storage Cleared (Payment Preserved)
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setDriveJob(job)}
                                  className="flex items-center gap-1 text-[11px] font-bold text-flame-blue bg-flame-blue/5 px-2 py-0.5 rounded border border-flame-blue/15"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Google Drive
                                </button>
                              )}
                              {job.paymentReceiptUrl && (
                                <button
                                  type="button"
                                  onClick={() => onViewReceipt(job)}
                                  className="flex items-center gap-1 text-[10px] font-bold text-flame-orange bg-flame-orange/10 px-2 py-0.5 rounded border border-flame-orange/20"
                                >
                                  Receipt
                                </button>
                              )}
                            </div>
                          </td>
                          {isStaff && (
                            <td className="py-3 px-4 whitespace-nowrap text-right">
                              {actions(job)}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            ) : (
              cards
            )}
          </div>
        </>
      )}

      <Modal
        isOpen={!!driveJob}
        onClose={() => setDriveJob(null)}
        wide
        title="Google Drive Storage Integration"
        subtitle={
          driveJob ? (
            <>
              Tracking Ref:{" "}
              <span className="font-mono text-flame-gold font-bold">
                {driveJob.trackingNumber}
              </span>
            </>
          ) : null
        }
        icon={
          <div className="w-9 h-9 rounded-xl bg-white/10 text-flame-gold border border-white/20 flex items-center justify-center">
            <ExternalLink className="w-5 h-5" />
          </div>
        }
      >
        {driveJob && (
          <div className="p-6 space-y-4">
            <div className="bg-flame-ivory p-4 rounded-2xl border border-flame-blue/10 space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-flame-blue/10 pb-2">
                <span className="text-flame-muted">File Name:</span>
                <span className="font-bold text-flame-ink">{driveJob.fileName}</span>
              </div>
              <div className="flex items-center justify-between text-xs border-b border-flame-blue/10 pb-2">
                <span className="text-flame-muted">Google Drive File ID:</span>
                <span className="font-mono text-flame-blue">{driveJob.gdriveFileId}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-flame-muted">Storage Location:</span>
                <span className="font-mono text-emerald-700">
                  Reprographics_Print_Queue_2026/
                </span>
              </div>
            </div>
            {driveJob.fileDataUrl?.startsWith("data:image") && (
              <div className="rounded-2xl overflow-hidden border border-flame-blue/10 bg-flame-ivory p-2 text-center">
                <img
                  src={driveJob.fileDataUrl}
                  alt="Document Preview"
                  className="max-h-64 mx-auto rounded-xl object-contain"
                />
              </div>
            )}
            <div className="flex gap-3">
              <a
                href={driveJob.gdriveFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-11 py-3 rounded-xl bg-flame-blue hover:bg-flame-blue-deep text-white font-bold text-xs flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Google Drive Web Viewer
              </a>
              <button
                type="button"
                onClick={() => setDriveJob(null)}
                className="px-4 min-h-11 rounded-xl bg-flame-ivory text-flame-ink font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
