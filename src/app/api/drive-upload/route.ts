import { mockDriveUpload } from "@/lib/gdrivesimulator";
import { isDriveConfigured, uploadFileToQueue } from "@/lib/drive-files";
import { promoteJobToDrive } from "@/lib/fulfill-payment";
import { ensureStoreLoaded, getServerStore } from "@/lib/server-store";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  await ensureStoreLoaded();
  try {
    const form = await request.formData();
    const jobId = String(form.get("jobId") || "");
    if (jobId) {
      const job = getServerStore().printJobs.find((item) => item.id === jobId);
      if (!job) {
        return NextResponse.json({ error: "Job not found." }, { status: 404 });
      }
      const promoted = await promoteJobToDrive(job);
      return NextResponse.json({
        fileId: promoted.gdriveFileId,
        webViewLink: promoted.gdriveFileUrl,
      });
    }

    const file = form.get("file");
    const trackingNumber = String(form.get("trackingNumber") || "REP");
    const role = String(form.get("role") || "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    if (!isDriveConfigured()) {
      return NextResponse.json(mockDriveUpload(file.name, trackingNumber));
    }

    const uploaded = await uploadFileToQueue(file, trackingNumber, role);
    return NextResponse.json(uploaded);
  } catch (error) {
    console.error("Drive upload failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
