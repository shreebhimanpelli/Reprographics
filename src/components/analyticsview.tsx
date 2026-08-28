"use client";

import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { paperSheetsForJob } from "@/lib/pricecalculator";
import type { PrintJob } from "@/types";
import {
  BarChart3,
  Download,
  FileText,
  IndianRupee,
  LayoutGrid,
  Printer,
} from "lucide-react";
import { useMemo, useState } from "react";

type Range = "TODAY" | "YESTERDAY" | "WEEK" | "ALL";

export function AnalyticsView({ jobs }: { jobs: PrintJob[] }) {
  const [range, setRange] = useState<Range>("TODAY");

  const filtered = useMemo(() => {
    const now = new Date();
    return jobs.filter((job) => {
      const created = new Date(job.createdAt);
      if (range === "TODAY") {
        return (
          created.getDate() === now.getDate() &&
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      }
      if (range === "YESTERDAY") {
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        return (
          created.getDate() === yesterday.getDate() &&
          created.getMonth() === yesterday.getMonth() &&
          created.getFullYear() === yesterday.getFullYear()
        );
      }
      if (range === "WEEK") {
        const week = new Date();
        week.setDate(now.getDate() - 7);
        return created >= week;
      }
      return true;
    });
  }, [jobs, range]);

  const totalJobs = filtered.length;
  const completed = filtered.filter(
    (job) => job.jobStatus === "COMPLETED" || job.jobStatus === "READY_FOR_PICKUP",
  ).length;
  const queued = filtered.filter(
    (job) =>
      job.jobStatus === "QUEUED" ||
      job.jobStatus === "PRINTING" ||
      job.jobStatus === "IN_PROGRESS",
  ).length;
  const revenue = filtered.reduce((sum, job) => sum + job.totalAmount, 0);
  const impressions = filtered.reduce(
    (sum, job) => sum + job.effectivePages * job.copyCount,
    0,
  );
  const sheets = filtered.reduce((sum, job) => sum + paperSheetsForJob(job), 0);
  const duplexSaved = filtered
    .filter((job) => job.duplexMode === "DUPLEX")
    .reduce((sum, job) => sum + Math.floor((job.effectivePages * job.copyCount) / 2), 0);

  const bwSingle = filtered.filter(
    (job) => job.printType === "BW" && job.duplexMode === "SINGLE",
  );
  const bwDuplex = filtered.filter(
    (job) => job.printType === "BW" && job.duplexMode === "DUPLEX",
  );
  const colorSingle = filtered.filter(
    (job) => job.printType === "COLOR" && job.duplexMode === "SINGLE",
  );
  const colorDuplex = filtered.filter(
    (job) => job.printType === "COLOR" && job.duplexMode === "DUPLEX",
  );

  const metric = (list: PrintJob[]) => ({
    jobs: list.length,
    pages: list.reduce((sum, job) => sum + job.effectivePages * job.copyCount, 0),
    amount: list.reduce((sum, job) => sum + job.totalAmount, 0),
  });

  const bwS = metric(bwSingle);
  const bwD = metric(bwDuplex);
  const cS = metric(colorSingle);
  const cD = metric(colorDuplex);

  const students = filtered.filter((job) => job.userRole === "STUDENT");
  const studentRevenue = students.reduce((sum, job) => sum + job.totalAmount, 0);
  const studentPages = students.reduce(
    (sum, job) => sum + job.effectivePages * job.copyCount,
    0,
  );
  const exempt = filtered.filter(
    (job) => job.userRole === "FACULTY" || job.userRole === "STAFF",
  );
  const exemptPages = exempt.reduce(
    (sum, job) => sum + job.effectivePages * job.copyCount,
    0,
  );

  return (
    <div className="space-y-6">
      <Card className="p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-flame-blue/10 text-flame-blue border border-flame-blue/15">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h2 className="font-display text-xl font-bold text-flame-blue tracking-tight">
              MIS Executive Telemetry & Stock Accounting
            </h2>
          </div>
          <p className="text-xs text-flame-muted mt-1 font-medium">
            Real-time MIS dashboard for paper inventory stock keeping, impression
            accounting, and department telemetry.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented<Range>
            value={range}
            onChange={setRange}
            options={[
              { id: "TODAY", label: "Today" },
              { id: "YESTERDAY", label: "Yesterday" },
              { id: "WEEK", label: "7 Days" },
              { id: "ALL", label: "All Time" },
            ]}
          />
          <button
            type="button"
            onClick={() => {
              const csv = encodeURI(
                "data:text/csv;charset=utf-8," +
                  [
                    "Tracking Number,User Name,Email,Role,File Name,Document Total Pages,Selected Page Range,Printable Pages,Copies,Total Printed Impressions,Paper Sheets Consumed,Print Type,Sides Mode,Total Amount (INR),Payment Status,Job Status,Timestamp",
                    ...filtered.map((job) => {
                      const sheetsUsed = paperSheetsForJob(job);
                      return [
                        job.trackingNumber,
                        `"${job.userName}"`,
                        job.userEmail,
                        job.userRole,
                        `"${job.fileName}"`,
                        job.pageCount,
                        `"${job.selectedPageRange}"`,
                        job.effectivePages,
                        job.copyCount,
                        job.effectivePages * job.copyCount,
                        sheetsUsed,
                        job.printType,
                        job.duplexMode,
                        job.totalAmount,
                        job.paymentStatus,
                        job.jobStatus,
                        job.createdAt,
                      ].join(",");
                    }),
                  ].join("\n"),
              );
              const link = document.createElement("a");
              link.setAttribute("href", csv);
              link.setAttribute(
                "download",
                `flame_repro_mis_telemetry_${range}_${new Date().toISOString().split("T")[0]}.csv`,
              );
              document.body.appendChild(link);
              link.click();
              link.remove();
            }}
            className="px-3.5 min-h-11 rounded-xl bg-flame-ivory hover:bg-flame-gold/20 text-flame-ink font-bold text-xs border border-flame-blue/10 flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Export Stock Telemetry (CSV)
          </button>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: range === "TODAY" ? "Today's Revenue" : "Revenue Collected",
            value: `₹${revenue.toFixed(2)}`,
            hint: "UPI paid by student print jobs",
            icon: IndianRupee,
            tone: "text-flame-blue",
          },
          {
            label: "Paper Sheets Consumed",
            value: sheets,
            hint: `~${(sheets / 500).toFixed(1)} Paper Reams (500 sheets/ream)`,
            icon: LayoutGrid,
            tone: "text-emerald-700",
            suffix: "Sheets",
          },
          {
            label: "Printed Impressions",
            value: impressions,
            hint: `${duplexSaved} duplex sheets saved`,
            icon: Printer,
            tone: "text-flame-orange",
            suffix: "Pages",
          },
          {
            label: "Print Jobs Volume",
            value: totalJobs,
            hint: `${completed} completed, ${queued} in queue`,
            icon: FileText,
            tone: "text-flame-gold",
            suffix: "Jobs",
          },
        ].map((card) => (
          <Card key={card.label} className="p-5">
            <div className={`flex items-center justify-between ${card.tone} mb-2`}>
              <span className="text-xs font-bold uppercase tracking-wider">{card.label}</span>
              <card.icon className="w-5 h-5" />
            </div>
            <div className="text-3xl font-black text-flame-ink">
              {card.value}{" "}
              {card.suffix && (
                <span className="text-sm text-flame-muted font-medium">{card.suffix}</span>
              )}
            </div>
            <div className="text-[11px] text-flame-muted font-medium mt-1">{card.hint}</div>
          </Card>
        ))}
      </div>

      <Card className="p-5 sm:p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-flame-blue/10 pb-4 gap-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-flame-blue" />
            <h3 className="font-display text-base font-bold text-flame-blue">
              Stock & Impression Breakdown by Printing Type
            </h3>
          </div>
          <span className="text-xs text-flame-muted font-mono font-medium">
            {range === "TODAY" ? "Today's Detailed Metrics" : `Filter: ${range}`}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "📄 B&W Single-Sided",
              data: bwS,
              sheets: bwS.pages,
              color: "bg-flame-blue",
            },
            {
              label: "📑 B&W Double-Sided",
              data: bwD,
              sheets: Math.ceil(bwD.pages / 2),
              color: "bg-flame-blue-mid",
            },
            {
              label: "🎨 Color Single-Sided",
              data: cS,
              sheets: cS.pages,
              color: "bg-flame-orange",
            },
            {
              label: "🌈 Color Double-Sided",
              data: cD,
              sheets: Math.ceil(cD.pages / 2),
              color: "bg-flame-gold",
            },
          ].map((block) => (
            <div
              key={block.label}
              className="bg-flame-ivory p-4 rounded-2xl border border-flame-blue/10 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-flame-blue uppercase tracking-wider">
                  {block.label}
                </span>
                <span className="text-[10px] bg-flame-paper px-2 py-0.5 rounded text-flame-ink font-mono border border-flame-blue/10">
                  {block.data.jobs} Jobs
                </span>
              </div>
              <div>
                <div className="text-xl font-extrabold text-flame-ink">
                  ₹{block.data.amount.toFixed(2)}
                </div>
                <div className="text-xs text-flame-muted font-medium mt-0.5">
                  {block.data.pages} pages printed ({block.sheets} sheets)
                </div>
              </div>
              <div className="w-full h-2 bg-flame-paper rounded-full overflow-hidden">
                <div
                  className={`h-full ${block.color} rounded-full`}
                  style={{ width: `${impressions ? (block.data.pages / impressions) * 100 : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-flame-blue">
            Student Paid Printing Accounting
          </h3>
          <div className="bg-flame-ivory p-4 rounded-2xl border border-flame-blue/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-flame-blue block">
                Student Revenue Collected
              </span>
              <span className="text-2xl font-black text-flame-ink">
                ₹{studentRevenue.toFixed(2)}
              </span>
              <span className="text-xs text-flame-muted font-medium block mt-0.5">
                {studentPages} Printed Impressions ({students.length} Jobs)
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-flame-blue/10 border border-flame-blue/20 flex items-center justify-center text-flame-blue font-bold">
              UPI
            </div>
          </div>
        </Card>
        <Card className="p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-flame-blue">
            Faculty & Staff Quota Accounting
          </h3>
          <div className="bg-flame-ivory p-4 rounded-2xl border border-flame-blue/10 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-700 block">
                Exempted Stock Volume
              </span>
              <span className="text-2xl font-black text-flame-ink">
                ₹0.00{" "}
                <span className="text-xs font-mono font-bold text-emerald-700">
                  (100% Exempted)
                </span>
              </span>
              <span className="text-xs text-flame-muted font-medium block mt-0.5">
                {exemptPages} Printed Impressions ({exempt.length} Jobs)
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 font-bold text-xs">
              Exempt
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
