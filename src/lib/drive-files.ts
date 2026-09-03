import { google } from "googleapis";
import { Readable } from "stream";

const DB_FILE_NAME = "reprographics-db.json";
const PENDING_FOLDER_NAME = "_pending_unpaid";

function driveAuth() {
  const email = process.env.GOOGLE_CLIENT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  if (!email || !key) return null;
  return new google.auth.JWT({
    email,
    key: key.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
}

function rootFolderId() {
  return process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || process.env.GOOGLE_DRIVE_FOLDER_ID || "";
}

export function isDriveConfigured() {
  return Boolean(driveAuth() && rootFolderId());
}

function driveClient() {
  const auth = driveAuth();
  if (!auth) return null;
  return google.drive({ version: "v3", auth });
}

async function findChild(name: string, parentId: string) {
  const drive = driveClient();
  if (!drive) return null;
  const result = await drive.files.list({
    q: `'${parentId}' in parents and name = '${name.replace(/'/g, "\\'")}' and trashed = false`,
    fields: "files(id, name, webViewLink, mimeType)",
    pageSize: 1,
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  });
  return result.data.files?.[0] || null;
}

async function getOrCreatePendingFolder() {
  const drive = driveClient();
  const parent = rootFolderId();
  if (!drive || !parent) return null;
  const existing = await findChild(PENDING_FOLDER_NAME, parent);
  if (existing?.id) return existing.id;
  const created = await drive.files.create({
    requestBody: {
      name: PENDING_FOLDER_NAME,
      mimeType: "application/vnd.google-apps.folder",
      parents: [parent],
    },
    fields: "id",
    supportsAllDrives: true,
  });
  return created.data.id || null;
}

export async function loadDurableDb(): Promise<Record<string, unknown> | null> {
  const drive = driveClient();
  const parent = rootFolderId();
  if (!drive || !parent) return null;
  const file = await findChild(DB_FILE_NAME, parent);
  if (!file?.id) return null;
  const res = await drive.files.get(
    { fileId: file.id, alt: "media", supportsAllDrives: true },
    { responseType: "text" },
  );
  const text = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
  return text ? (JSON.parse(text) as Record<string, unknown>) : null;
}

export async function saveDurableDb(payload: unknown) {
  const drive = driveClient();
  const parent = rootFolderId();
  if (!drive || !parent) return;
  const body = JSON.stringify(payload);
  const existing = await findChild(DB_FILE_NAME, parent);
  const media = {
    mimeType: "application/json",
    body: Readable.from([body]),
  };
  if (existing?.id) {
    await drive.files.update({
      fileId: existing.id,
      media,
      supportsAllDrives: true,
    });
    return;
  }
  await drive.files.create({
    requestBody: {
      name: DB_FILE_NAME,
      parents: [parent],
      mimeType: "application/json",
    },
    media,
    fields: "id",
    supportsAllDrives: true,
  });
}

export async function savePendingDriveFile(jobId: string, file: File) {
  const drive = driveClient();
  const pendingFolder = await getOrCreatePendingFolder();
  if (!drive || !pendingFolder) {
    throw new Error("Google Drive is not configured.");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const created = await drive.files.create({
    requestBody: {
      name: `PENDING_${jobId}_${file.name}`,
      parents: [pendingFolder],
    },
    media: {
      mimeType: file.type || "application/octet-stream",
      body: Readable.from(buffer),
    },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });
  return {
    pendingFileId: created.data.id || "",
    pendingWebViewLink: created.data.webViewLink || "",
  };
}

export async function promotePendingFileToQueue(input: {
  pendingFileId: string;
  trackingNumber: string;
  role: string;
  fileName: string;
}) {
  const drive = driveClient();
  const parent = rootFolderId();
  const pendingFolder = await getOrCreatePendingFolder();
  if (!drive || !parent) {
    throw new Error("Google Drive is not configured.");
  }
  const updated = await drive.files.update({
    fileId: input.pendingFileId,
    addParents: parent,
    removeParents: pendingFolder || undefined,
    requestBody: {
      name: `${input.trackingNumber}_${input.role}_${input.fileName}`,
    },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });
  return {
    fileId: updated.data.id || input.pendingFileId,
    webViewLink:
      updated.data.webViewLink ||
      `https://drive.google.com/file/d/${input.pendingFileId}/view`,
  };
}

export async function uploadBufferToQueue(input: {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  trackingNumber: string;
  role: string;
}) {
  const drive = driveClient();
  const parent = rootFolderId();
  if (!drive || !parent) {
    throw new Error("Google Drive is not configured.");
  }
  const created = await drive.files.create({
    requestBody: {
      name: `${input.trackingNumber}_${input.role}_${input.fileName}`,
      parents: [parent],
    },
    media: {
      mimeType: input.mimeType || "application/octet-stream",
      body: Readable.from(input.buffer),
    },
    fields: "id, webViewLink",
    supportsAllDrives: true,
  });
  return {
    fileId: created.data.id || "",
    webViewLink:
      created.data.webViewLink ||
      `https://drive.google.com/file/d/${created.data.id}/view`,
  };
}

export async function uploadFileToQueue(file: File, trackingNumber: string, role: string) {
  const buffer = Buffer.from(await file.arrayBuffer());
  return uploadBufferToQueue({
    buffer,
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    trackingNumber,
    role,
  });
}

