import JSZip from "jszip";

export interface AnalyzedDocument {
  pageCount: number;
  dataUrl: string;
}

let pdfjsModule: typeof import("pdfjs-dist") | null = null;

async function loadPdfjs() {
  if (typeof window === "undefined") return null;
  if (pdfjsModule) return pdfjsModule;
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.js";
  pdfjsModule = pdfjs;
  return pdfjs;
}

function pageCountFromPdfBinary(buffer: ArrayBuffer): number {
  const text = new TextDecoder("latin1").decode(new Uint8Array(buffer));
  const catalog = text.match(/\/Type\s*\/Pages\b[\s\S]{0,400}?\/Count\s+(\d+)/);
  if (catalog?.[1]) {
    const count = parseInt(catalog[1], 10);
    if (count > 0 && count < 10000) return count;
  }

  const counts = [...text.matchAll(/\/Type\s*\/Pages\b[^>]*?\/Count\s+(\d+)/g)]
    .map((match) => parseInt(match[1], 10))
    .filter((n) => n > 0 && n < 10000);
  if (counts.length > 0) return Math.max(...counts);

  const pages = text.match(/\/Type\s*\/Page(?!s)\b/g);
  return pages && pages.length > 0 ? pages.length : 0;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}

function extensionOf(file: File) {
  const fromName = (file.name.split(".").pop() || "").toLowerCase();
  if (fromName) return fromName;
  const mime = (file.type || "").toLowerCase();
  if (mime.includes("pdf")) return "pdf";
  if (mime.includes("wordprocessingml") || mime.includes("msword")) return "docx";
  if (mime.includes("presentationml") || mime.includes("powerpoint")) return "pptx";
  if (mime.startsWith("image/")) return mime.split("/")[1] || "png";
  return "";
}

async function countPdfPages(buffer: ArrayBuffer): Promise<number> {
  const pdfjs = await loadPdfjs();
  if (pdfjs) {
    const data = new Uint8Array(buffer);
    const options = {
      data,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      disableAutoFetch: true,
      disableStream: true,
    } as const;

    try {
      const doc = await pdfjs.getDocument(options).promise;
      const pages = doc?.numPages || 0;
      try {
        await doc.destroy();
      } catch {
        /* ignore */
      }
      if (pages > 0) return pages;
    } catch (error) {
      console.warn("pdf.js worker parse failed, retrying without worker:", error);
      try {
        const doc = await pdfjs.getDocument({
          ...options,
          disableWorker: true,
        } as Parameters<typeof pdfjs.getDocument>[0]).promise;
        const pages = doc?.numPages || 0;
        try {
          await doc.destroy();
        } catch {
          /* ignore */
        }
        if (pages > 0) return pages;
      } catch (retryError) {
        console.warn("pdf.js parse failed:", retryError);
      }
    }
  }

  return pageCountFromPdfBinary(buffer);
}

function countDocxPagesFromXml(appXml: string, documentXml: string): number {
  const appMatch = appXml.match(
    /<(?:[a-zA-Z0-9]+:)?Pages>(\d+)<\/(?:[a-zA-Z0-9]+:)?Pages>/,
  );
  const appPages = appMatch?.[1] ? parseInt(appMatch[1], 10) : 0;
  const renderedBreaks = documentXml.match(/<w:lastRenderedPageBreak\b/g);
  const renderedPages = renderedBreaks ? renderedBreaks.length + 1 : 0;
  const explicitBreaks = documentXml.match(/<w:br\b[^>]*w:type="page"/g);
  const breakPages = explicitBreaks ? explicitBreaks.length + 1 : 0;
  return Math.max(appPages, renderedPages, breakPages, 1);
}

async function countOfficePages(file: File, extension: string): Promise<number> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  if (extension === "pptx" || extension === "ppt") {
    const slides = Object.keys(zip.files).filter((name) =>
      /^ppt\/slides\/slide\d+\.xml$/i.test(name),
    );
    if (slides.length > 0) return slides.length;
    const appXml = zip.file("docProps/app.xml");
    if (appXml) {
      const xml = await appXml.async("string");
      const match = xml.match(
        /<(?:[a-zA-Z0-9]+:)?Slides>(\d+)<\/(?:[a-zA-Z0-9]+:)?Slides>/,
      );
      if (match?.[1]) return Math.max(1, parseInt(match[1], 10));
    }
    return 1;
  }

  const appXml = (await zip.file("docProps/app.xml")?.async("string")) || "";
  const documentXml = (await zip.file("word/document.xml")?.async("string")) || "";
  return countDocxPagesFromXml(appXml, documentXml);
}

export async function analyzeDocument(file: File): Promise<AnalyzedDocument> {
  const extension = extensionOf(file);
  const dataUrl = await readAsDataUrl(file);

  if (extension === "pdf") {
    try {
      const pageCount = await countPdfPages(await file.arrayBuffer());
      if (pageCount > 0) return { pageCount, dataUrl };
    } catch (error) {
      console.warn("PDF page detection failed:", error);
    }
    return { pageCount: 1, dataUrl };
  }

  if (["png", "jpg", "jpeg", "webp", "gif", "bmp", "tif", "tiff"].includes(extension)) {
    return { pageCount: 1, dataUrl };
  }

  if (["docx", "pptx"].includes(extension)) {
    try {
      return { pageCount: await countOfficePages(file, extension), dataUrl };
    } catch (error) {
      console.warn(`Failed to parse ${extension} page count:`, error);
      return { pageCount: 1, dataUrl };
    }
  }

  return { pageCount: 1, dataUrl };
}
