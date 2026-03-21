import { PDFDocument } from "pdf-lib";

/**
 * Merge multiple PDF buffers into a single PDF document.
 * Used to assemble a complete Swiss-style application dossier:
 * CV + cover letter + references + diplomas/certificates/permits.
 */
export async function assembleDossier(
  pdfBuffers: Buffer[]
): Promise<Buffer> {
  const mergedDoc = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const srcDoc = await PDFDocument.load(buffer);
    const pages = await mergedDoc.copyPages(srcDoc, srcDoc.getPageIndices());
    pages.forEach((page) => mergedDoc.addPage(page));
  }

  const mergedBytes = await mergedDoc.save();
  return Buffer.from(mergedBytes);
}
