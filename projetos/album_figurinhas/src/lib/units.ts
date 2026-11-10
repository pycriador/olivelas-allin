// A4 dimensions: 21cm x 29.7cm. Use 96 DPI standard CSS px (1cm = 37.7952756 px).
// For PDF export we use jsPDF in mm directly (10mm = 1cm), so positions are stored in cm.
export const A4_WIDTH_CM = 21;
export const A4_HEIGHT_CM = 29.7;
export const PX_PER_CM = 37.7952756;

export const cmToPx = (cm: number) => cm * PX_PER_CM;
export const pxToCm = (px: number) => px / PX_PER_CM;
export const cmToMm = (cm: number) => cm * 10;

/** Compute the pixel scale needed so that an A4 canvas fits a given container. */
export function computeCanvasScale(containerWidthPx: number, containerHeightPx: number) {
  const baseW = cmToPx(A4_WIDTH_CM);
  const baseH = cmToPx(A4_HEIGHT_CM);
  const sx = containerWidthPx / baseW;
  const sy = containerHeightPx / baseH;
  return Math.max(0.05, Math.min(sx, sy));
}