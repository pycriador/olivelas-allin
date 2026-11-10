import jsPDF from "jspdf";
import { toPng } from "html-to-image";
import { A4_HEIGHT_CM, A4_WIDTH_CM } from "./units";

/**
 * Renders a DOM node that visually represents an A4 page into a single PDF page.
 * The node must have the exact A4 aspect ratio (handled by PageCanvas).
 */
export async function exportNodesToPdf(nodes: HTMLElement[], filename: string) {
  if (nodes.length === 0) return;
  const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait", compress: true });
  const wMm = A4_WIDTH_CM * 10;
  const hMm = A4_HEIGHT_CM * 10;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const dataUrl = await toPng(node, {
      pixelRatio: 2.5,
      cacheBust: true,
      backgroundColor: "#ffffff",
      skipFonts: false,
    });
    if (i > 0) pdf.addPage("a4", "portrait");
    pdf.addImage(dataUrl, "PNG", 0, 0, wMm, hMm, undefined, "FAST");
  }
  pdf.save(filename);
}