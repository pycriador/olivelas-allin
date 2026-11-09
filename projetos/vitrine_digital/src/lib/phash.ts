/** Hash perceptual simples (average hash 8x8) calculado no navegador. */
export async function computeAverageHash(file: File): Promise<string> {
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = 8;
    canvas.height = 8;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(bitmap, 0, 0, 8, 8);
    const { data } = ctx.getImageData(0, 0, 8, 8);
    const grays: number[] = [];
    for (let i = 0; i < data.length; i += 4) {
      grays.push(0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!);
    }
    const avg = grays.reduce((a, b) => a + b, 0) / grays.length;
    const bits = grays.map((g) => (g >= avg ? "1" : "0")).join("");
    let hex = "";
    for (let i = 0; i < 64; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
    return hex;
  } catch {
    return "";
  }
}
