import fs from "fs";
import path from "path";

function pendingDir() {
  return path.join(process.cwd(), ".data", "pending");
}

export function pendingFilePath(jobId: string) {
  return path.join(pendingDir(), jobId);
}

export async function savePendingLocalFile(jobId: string, file: File) {
  const dest = pendingFilePath(jobId);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(await file.arrayBuffer()));
  fs.writeFileSync(
    `${dest}.json`,
    JSON.stringify({
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
    }),
  );
  return dest;
}

export function readPendingLocalFile(jobId: string) {
  const dest = pendingFilePath(jobId);
  if (!fs.existsSync(dest)) return null;
  let meta = { fileName: "document", mimeType: "application/octet-stream" };
  try {
    meta = JSON.parse(fs.readFileSync(`${dest}.json`, "utf8")) as typeof meta;
  } catch {
    /* ignore */
  }
  return {
    buffer: fs.readFileSync(dest),
    ...meta,
  };
}

export function deletePendingLocalFile(jobId: string) {
  const dest = pendingFilePath(jobId);
  if (fs.existsSync(dest)) fs.unlinkSync(dest);
  if (fs.existsSync(`${dest}.json`)) fs.unlinkSync(`${dest}.json`);
}
