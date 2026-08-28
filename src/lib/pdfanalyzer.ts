import JSZip from "jszip";

export interface AnalyzedDocument {
  pageCount: number;
  dataUrl: string;
}

let pdfjsModule: typeof import("pdfjs-dist") | null = null;

async function loadPdfjs() {
  if (pdfjsModule) return pdfjsModule;
  try {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "";
    pdfjsModule = pdfjs;
    return pdfjs;
  } catch (error) {
    console.warn("Failed to load pdfjs-dist:", error);
    return null;
  }
}

function pageCountFromPdfBinary(buffer: ArrayBuffer): number {
  const bytes = new Uint8Array(buffer);
  const text = new TextDecoder("latin1").decode(bytes);
  const counts = [...text.matchAll(/\/Count\s+(\d+)/g)];
  if (counts.length > 0) {
    const values = counts
      .map((match) => parseInt(match[1], 10))
      .filter((n) => !isNaN(n) && n > 0 && n < 5000);
    if (values.length > 0) return Math.max(...values);
  }
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

export async function analyzeDocument(file: File): Promise<AnalyzedDocument> {
  const extension = (file.name.split(".").pop() || "").toLowerCase();
  const dataUrl = await readAsDataUrl(file);

  if (extension === "pdf") {
    try {
      const buffer = await file.arrayBuffer();
      const pdfjs = await loadPdfjs();
      if (pdfjs) {
        try {
          const loadingTask = pdfjs.getDocument({
            data: new Uint8Array(buffer),
            useWorkerFetch: false,
            isEvalSupported: false,
            useSystemFonts: true,
          });
          const doc = await loadingTask.promise;
          if (doc && doc.numPages > 0) {
            return { pageCount: doc.numPages, dataUrl };
          }
        } catch (error) {
          console.warn("pdfjs-dist parsing failed, using binary fallback:", error);
        }
      }
      const fallbackCount = pageCountFromPdfBinary(buffer);
      if (fallbackCount > 0) return { pageCount: fallbackCount, dataUrl };
    } catch (error) {
      console.warn("PDF parsing error:", error);
    }
    return {
      pageCount: Math.min(Math.max(1, Math.ceil(file.size / 122880)), 100),
      dataUrl,
    };
  }

  if (["png", "jpg", "jpeg", "webp", "gif", "bmp", "tiff"].includes(extension)) {
    return { pageCount: 1, dataUrl };
  }

  if (["docx", "pptx"].includes(extension)) {
    try {
      const buffer = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      const appXml = zip.file("docProps/app.xml");
      if (appXml) {
        const xml = await appXml.async("string");
        let count = 0;
        if (extension === "docx") {
          const match = xml.match(
            /<(?:[a-zA-Z0-9]+:)?Pages>(\d+)<\/(?:[a-zA-Z0-9]+:)?Pages>/,
          );
          if (match?.[1]) count = parseInt(match[1], 10);
        } else {
          const match = xml.match(
            /<(?:[a-zA-Z0-9]+:)?Slides>(\d+)<\/(?:[a-zA-Z0-9]+:)?Slides>/,
          );
          if (match?.[1]) count = parseInt(match[1], 10);
        }
        if (count > 0) return { pageCount: count, dataUrl };
      }
    } catch (error) {
      console.warn(`Failed to parse ${extension} metadata with JSZip:`, error);
    }
    const bytesPerPage = extension === "docx" ? 35000 : 180000;
    return {
      pageCount: Math.min(Math.max(1, Math.round(file.size / bytesPerPage)), 100),
      dataUrl,
    };
  }

  return { pageCount: 1, dataUrl };
}
