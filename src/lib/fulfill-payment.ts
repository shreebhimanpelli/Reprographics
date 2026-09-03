import { isDriveConfigured, uploadBufferToQueue } from "@/lib/drive-files";
import {
  deletePendingLocalFile,
  readPendingLocalFile,
} from "@/lib/pending-files";
import {
  applyPaymentSuccess,
  persistStore,
  upsertPrintJobs,
} from "@/lib/server-store";
import type { PrintJob } from "@/types";

export async function promoteJobToDrive(job: PrintJob): Promise<PrintJob> {
  if (job.gdriveFileId) return job;

  const pending = readPendingLocalFile(job.id);
  if (!pending || !isDriveConfigured()) return job;

  const uploaded = await uploadBufferToQueue({
    buffer: pending.buffer,
    fileName: job.fileName || pending.fileName,
    mimeType: pending.mimeType,
    trackingNumber: job.trackingNumber,
    role: job.userRole,
  });

  deletePendingLocalFile(job.id);

  const next: PrintJob = {
    ...job,
    gdriveFileId: uploaded.fileId,
    gdriveFileUrl: uploaded.webViewLink,
    pendingFileId: undefined,
    updatedAt: new Date().toISOString(),
  };
  upsertPrintJobs([next]);
  return next;
}

export async function fulfillPaidJobs(
  hdfcOrderId: string,
  utr?: string,
): Promise<PrintJob[]> {
  const jobs = applyPaymentSuccess(hdfcOrderId, utr);
  const promoted: PrintJob[] = [];
  for (const job of jobs) {
    try {
      promoted.push(await promoteJobToDrive(job));
    } catch (error) {
      console.error(`Drive upload failed for ${job.id}:`, error);
      promoted.push(job);
    }
  }
  await persistStore();
  return promoted;
}
