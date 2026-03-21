/**
 * Client-side utility: renders ALL pages of a PDF to canvases,
 * then converts each to a base64 PNG string (without the data URI prefix).
 *
 * Uses pdfjs-dist loaded dynamically to keep the initial bundle small.
 */

/** Convert all pages of a PDF to base64 PNG images */
export async function pdfToImages(file: File): Promise<string[]> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdf.numPages;

  const images: string[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const scale = 2;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    await page.render({ canvas, viewport }).promise;

    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
    images.push(base64);

    // Cleanup
    canvas.width = 0;
    canvas.height = 0;
  }

  return images;
}

/** Backward-compatible: convert first page only (for preview thumbnail) */
export async function pdfToImage(file: File): Promise<string> {
  const images = await pdfToImages(file);
  return images[0] || "";
}
