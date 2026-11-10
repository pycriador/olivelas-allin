// Client-side PDF generation: rasterizes each .pdf-page and embeds as image in a PDF.
import { PDFDocument } from "pdf-lib";
import html2canvas from "html2canvas";
import { pageSizeMm, type PdfLayout } from "./layout";

const MM_TO_PT = 2.83464567;

export async function generatePdf(
  container: HTMLElement,
  layout: PdfLayout,
  fileName: string,
): Promise<void> {
  const pages = Array.from(container.querySelectorAll<HTMLElement>(".pdf-page"));
  if (pages.length === 0) throw new Error("Nada para exportar");
  const { w: mmW, h: mmH } = pageSizeMm(layout);
  const ptW = mmW * MM_TO_PT;
  const ptH = mmH * MM_TO_PT;

  const doc = await PDFDocument.create();
  for (const el of pages) {
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: layout.themeColors.bg,
      logging: false,
    });
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    const bytes = await (await fetch(dataUrl)).arrayBuffer();
    const img = await doc.embedJpg(bytes);
    const page = doc.addPage([ptW, ptH]);
    page.drawImage(img, { x: 0, y: 0, width: ptW, height: ptH });
  }

  const pdfBytes = await doc.save();
  const arr = new Uint8Array(pdfBytes);
  // Copy into a fresh ArrayBuffer to satisfy strict BlobPart typings
  const buf = new ArrayBuffer(arr.byteLength);
  new Uint8Array(buf).set(arr);
  const blob = new Blob([buf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}