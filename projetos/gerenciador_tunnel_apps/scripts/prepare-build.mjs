import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

// 1. Garantir cópia do preload.cjs para dist-server/electron/preload.cjs
const srcPreload = path.resolve('src/electron/preload.cjs');
const destDir = path.resolve('dist-server/electron');
const destPreload = path.join(destDir, 'preload.cjs');

if (fs.existsSync(srcPreload)) {
  fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(srcPreload, destPreload);
  console.log('✅ Copiado preload.cjs para dist-server/electron/preload.cjs');
}

// 2. Gerar ícone PNG 512x512 válido em build/icons/icon.png se não existir
const iconsDir = path.resolve('build/icons');
fs.mkdirSync(iconsDir, { recursive: true });

function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ crcTable[(c ^ buf[i]) & 0xff];
  }
  return (c ^ -1) >>> 0;
}

const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function generatePngIcon(size = 512) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  const center = size / 2;
  const radius = size * 0.44;
  const innerRing1 = size * 0.30;
  const innerRing2 = size * 0.16;

  for (let y = 0; y < size; y++) {
    const rowOffset = y * (size * 4 + 1);
    raw[rowOffset] = 0; // filter type 0
    for (let x = 0; x < size; x++) {
      const px = rowOffset + 1 + x * 4;
      const dx = x - center;
      const dy = y - center;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded square mask
      const normX = Math.abs(dx) / (size * 0.45);
      const normY = Math.abs(dy) / (size * 0.45);
      const squircle = Math.pow(normX, 4) + Math.pow(normY, 4);

      if (squircle > 1.0) {
        // Transparent outside
        raw[px] = 0;
        raw[px + 1] = 0;
        raw[px + 2] = 0;
        raw[px + 3] = 0;
      } else {
        // Dark zinc background with emerald/indigo tunnel rings
        let r = 15, g = 23, b = 42, a = 255;

        const isRing1 = Math.abs(dist - radius * 0.72) < size * 0.028;
        const isRing2 = Math.abs(dist - innerRing1 * 0.72) < size * 0.025;
        const isCore = dist < innerRing2 * 0.55;

        if (isCore) {
          // Emerald glowing core
          r = 16; g = 185; b = 129;
        } else if (isRing1) {
          // Indigo outer tunnel wave
          r = 99; g = 102; b = 241;
        } else if (isRing2) {
          // Cyan/Emerald inner tunnel wave
          r = 52; g = 211; b = 153;
        } else {
          // Subtle gradient background
          const grad = (x + y) / (size * 2);
          r = Math.round(12 + grad * 18);
          g = Math.round(16 + grad * 24);
          b = Math.round(28 + grad * 40);
        }

        raw[px] = r;
        raw[px + 1] = g;
        raw[px + 2] = b;
        raw[px + 3] = a;
      }
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = zlib.deflateSync(raw);
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', idat),
    makeChunk('IEND', iend),
  ]);
}

const iconPngPath = path.join(iconsDir, 'icon.png');
if (!fs.existsSync(iconPngPath)) {
  fs.writeFileSync(iconPngPath, generatePngIcon(512));
  console.log('✅ Ícone 512x512 gerado em build/icons/icon.png');
}
