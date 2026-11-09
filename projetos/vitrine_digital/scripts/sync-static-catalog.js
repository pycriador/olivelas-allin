import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const jsonPath = path.join(rootDir, 'static', 'data', 'anuncios.json');
const imagesDir = path.join(rootDir, 'static', 'images');

if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

if (!fs.existsSync(jsonPath)) {
  console.error('Arquivo data/anuncios.json não encontrado.');
  process.exit(1);
}

const rawData = fs.readFileSync(jsonPath, 'utf8');
const anuncios = JSON.parse(rawData);

function downloadImage(url, dest) {
  return new Promise((resolve) => {
    if (fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
      return resolve(true);
    }
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve(true);
        });
      } else {
        file.close();
        if (fs.existsSync(dest)) fs.unlinkSync(dest);
        resolve(false);
      }
    }).on('error', () => {
      file.close();
      if (fs.existsSync(dest)) fs.unlinkSync(dest);
      resolve(false);
    });
  });
}

async function syncAll() {
  console.log('Sincronizando imagens da Vitrine Estatica...');
  let downloadedCount = 0;

  for (const ad of anuncios) {
    if (ad.primaryImage && ad.primaryImage.startsWith('http')) {
      const url = ad.primaryImage;
      const cleanUrl = url.split('?')[0];
      const filename = path.basename(cleanUrl) || (ad.id + '.jpg');
      const dest = path.join(imagesDir, filename);

      const ok = await downloadImage(url, dest);
      if (ok) {
        downloadedCount++;
        ad.primaryImage = 'images/' + filename;
      }
    }

    if (Array.isArray(ad.images)) {
      for (const img of ad.images) {
        if (img.url && img.url.startsWith('http')) {
          const url = img.url;
          const cleanUrl = url.split('?')[0];
          const filename = path.basename(cleanUrl) || (img.id + '.jpg');
          const dest = path.join(imagesDir, filename);

          const ok = await downloadImage(url, dest);
          if (ok) {
            downloadedCount++;
            img.url = 'images/' + filename;
          }
        }
      }
    }
  }

  fs.writeFileSync(jsonPath, JSON.stringify(anuncios, null, 2), 'utf8');
  console.log('Sincronizacao concluida com sucesso! Imagens processadas: ' + downloadedCount);
}

syncAll();
