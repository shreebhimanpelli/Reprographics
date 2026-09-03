import { isDriveConfigured } from "@/lib/drive-files";
import { promoteJobToDrive } from "@/lib/fulfill-payment";
import { savePendingLocalFile } from "@/lib/pending-files";
import { ensureStoreLoaded, persistStore, upsertPrintJobs } from "@/lib/server-store";
import type { PrintJob } from "@/types";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  await ensureStoreLoaded();
  try {
    const form = await request.formData();
    const file = form.get("file");
    const metaRaw = String(form.get("meta") || "");
    if (!(file instanceof File) || !metaRaw) {
      return NextResponse.json({ error: "Missing file or job details." }, { status: 400 });
    }

    const meta = JSON.parse(metaRaw) as Omit<PrintJob, "id" | "createdAt" | "updatedAt">;
    const now = new Date().toISOString();
    const job: PrintJob = {
      ...meta,
      id: `job-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: now,
      updatedAt: now,
      gdriveFileId: "",
      gdriveFileUrl: "",
      fileDataUrl: undefined,
    };

    await savePendingLocalFile(job.id, file);
    job.pendingFileId = job.id;
    upsertPrintJobs([job]);

    if (job.paymentStatus === "EXEMPT" && isDriveConfigured()) {
      const promoted = await promoteJobToDrive(job);
      await persistStore();
      return NextResponse.json(promoted);
    }

    await persistStore();
    return NextResponse.json(job);
  } catch (error) {
    console.error("Create job failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to save print job." },
      { status: 500 },
    );
  }
}
