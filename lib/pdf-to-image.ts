/**
 * Client-side utility: renders the first page of a PDF to a canvas,
 * then converts to a base64 PNG string (without the data URI prefix).
 *
 * Uses pdfjs-dist loaded dynamically to keep the initial bundle small.
 */
export async function pdfToImage(file: File): Promise<string> {
  // 1. Dynamic import — pdfjs-dist is heavy
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  // 2. Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // 3. Load PDF document
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // 4. Get first page
  const page = await pdf.getPage(1);

  // 5. Create canvas and render at scale 2 for quality
  const scale = 2;
  const viewport = page.getViewport({ scale });

  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvas, viewport }).promise;

  // 6. Convert canvas to base64 PNG
  const dataUrl = canvas.toDataURL("image/png");

  // 7. Strip the data:image/png;base64, prefix
  const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");

  // Cleanup
  canvas.width = 0;
  canvas.height = 0;

  return base64;
}
