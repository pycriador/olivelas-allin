import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');
const notFoundPath = path.join(distDir, '404.html');

if (fs.existsSync(indexPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('[SPA Support] Successfully copied index.html to 404.html for GitHub Pages routing.');
} else {
  console.warn('[SPA Support] dist/index.html not found, skipping 404.html copy.');
}
