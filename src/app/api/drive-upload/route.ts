import { mockDriveUpload } from "@/lib/gdrivesimulator";
import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const trackingNumber = String(form.get("trackingNumber") || "REP");
    const role = String(form.get("role") || "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const email = process.env.GOOGLE_CLIENT_EMAIL;
    const key = process.env.GOOGLE_PRIVATE_KEY;
    const folderId =
      process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!email || !key || !folderId) {
      return NextResponse.json(mockDriveUpload(file.name, trackingNumber));
    }

    const auth = new google.auth.JWT({
      email,
      key: key.replace(/\\n/g, "\n"),
      scopes: ["https://www.googleapis.com/auth/drive"],
    });
    const drive = google.drive({ version: "v3", auth });
    const buffer = Buffer.from(await file.arrayBuffer());
    const created = await drive.files.create({
      requestBody: {
        name: `${trackingNumber}_${role}_${file.name}`,
        parents: [folderId],
      },
      media: {
        mimeType: file.type || "application/octet-stream",
        body: Readable.from(buffer),
      },
      fields: "id, webViewLink",
    });

    return NextResponse.json({
      fileId: created.data.id,
      webViewLink:
        created.data.webViewLink ||
        `https://drive.google.com/file/d/${created.data.id}/view`,
    });
  } catch (error) {
    console.error("Drive upload failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 500 },
    );
  }
}
