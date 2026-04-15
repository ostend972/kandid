"use client";

/**
 * Client-side face detection from PDF page renders.
 * Uses @vladmandic/face-api with TinyFaceDetector (~190KB model).
 *
 * Flow: render PDF page 1 → detect face → crop with padding → return JPEG blob
 */

import * as faceapi from "@vladmandic/face-api";

let modelsLoaded = false;

async function ensureModels(): Promise<void> {
  if (modelsLoaded) return;
  await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
  modelsLoaded = true;
}

/**
 * Render page 1 of a PDF, detect a face, and return a cropped JPEG blob.
 * Returns null if no face is found.
 */
export async function extractFaceFromPdf(file: File): Promise<Blob | null> {
  const pdfjsLib = await import("pdfjs-dist");
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const page = await pdf.getPage(1);

  const scale = 2;
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvas, viewport }).promise;

  const face = await detectAndCrop(canvas);

  canvas.width = 0;
  canvas.height = 0;

  return face;
}

/**
 * Detect a single face in a canvas and return a cropped 400x400 JPEG blob.
 * Adds padding around the face for head + shoulders framing.
 */
async function detectAndCrop(
  canvas: HTMLCanvasElement
): Promise<Blob | null> {
  await ensureModels();

  const detection = await faceapi.detectSingleFace(
    canvas as unknown as faceapi.TNetInput,
    new faceapi.TinyFaceDetectorOptions({
      inputSize: 512,
      scoreThreshold: 0.4,
    })
  );

  if (!detection) return null;

  const { x, y, width, height } = detection.box;
  const faceSize = Math.max(width, height);

  // Expand to include head + shoulders (roughly 2.5x face size, square crop)
  const cropSize = faceSize * 2.8;
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  // Shift crop slightly up to include more forehead, less chest
  let cropX = centerX - cropSize / 2;
  let cropY = centerY - cropSize * 0.4;

  // Clamp to canvas bounds
  cropX = Math.max(0, cropX);
  cropY = Math.max(0, cropY);
  const actualW = Math.min(cropSize, canvas.width - cropX);
  const actualH = Math.min(cropSize, canvas.height - cropY);

  const outputSize = 400;
  const cropCanvas = document.createElement("canvas");
  cropCanvas.width = outputSize;
  cropCanvas.height = outputSize;
  const ctx = cropCanvas.getContext("2d");
  if (!ctx) return null;

  ctx.drawImage(
    canvas,
    cropX,
    cropY,
    actualW,
    actualH,
    0,
    0,
    outputSize,
    outputSize
  );

  return new Promise<Blob | null>((resolve) => {
    cropCanvas.toBlob(
      (blob) => {
        cropCanvas.width = 0;
        cropCanvas.height = 0;
        resolve(blob);
      },
      "image/jpeg",
      0.9
    );
  });
}
