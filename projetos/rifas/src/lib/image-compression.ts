export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

const DEFAULT_OPTIONS: Required<CompressOptions> = {
  maxWidth: 1600,
  maxHeight: 1600,
  quality: 0.82,
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Falha ao carregar a imagem"));
    };
    image.src = url;
  });
}

/**
 * Comprime/re-dimensiona uma imagem no navegador via canvas. Retorna o
 * arquivo original quando a compressão resultaria em um arquivo maior.
 */
export async function compressImage(file: File, options: CompressOptions = {}): Promise<File> {
  if (!file.type.startsWith("image/")) return file;

  const { maxWidth, maxHeight, quality } = { ...DEFAULT_OPTIONS, ...options };
  const image = await loadImage(file);

  const ratio = Math.min(1, maxWidth / image.naturalWidth, maxHeight / image.naturalHeight);
  const width = Math.max(1, Math.round(image.naturalWidth * ratio));
  const height = Math.max(1, Math.round(image.naturalHeight * ratio));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(image, 0, 0, width, height);

  const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, quality));
  if (!blob) return file;
  if (blob.size >= file.size) return file;

  return new File([blob], file.name, { type: blob.type, lastModified: Date.now() });
}
