import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputPublicDir = path.resolve(rootDir, '.output', 'public');
const distDir = path.resolve(rootDir, 'dist-gh-pages');

console.log('🚀 Building ServiceForge for GitHub Pages...');

// 1. Run vite build if .output/public does not exist or if requested
if (!fs.existsSync(outputPublicDir)) {
  console.log('📦 Executing npm run build...');
  execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });
} else {
  console.log('⚡ Found existing .output/public build, preparing GitHub Pages bundle...');
}

// 2. Prepare dist-gh-pages directory
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy all files and folders from .output/public to dist-gh-pages
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDirSync(outputPublicDir, distDir);

// 3. Find client entry and css files in assets/
const assetsDir = path.join(distDir, 'assets');
let mainJsFile = '';
let mainCssFile = '';

if (fs.existsSync(assetsDir)) {
  const files = fs.readdirSync(assetsDir);
  mainJsFile = files.find(f => f.startsWith('index-') && f.endsWith('.js')) || '';
  mainCssFile = files.find(f => f.startsWith('styles-') && f.endsWith('.css')) || '';
}

console.log(`📄 Main JS: ${mainJsFile}`);
console.log(`🎨 Main CSS: ${mainCssFile}`);

if (!mainJsFile || !mainCssFile) {
  console.error('❌ Could not find main JS or CSS in assets directory!');
  process.exit(1);
}

// 4. Generate index.html
const indexHtmlContent = `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ServiceForge — Plataforma de Assistência Técnica</title>
    <meta name="description" content="SaaS modular para gestão de assistências técnicas." />
    <meta name="author" content="ServiceForge" />
    <meta property="og:title" content="ServiceForge — Plataforma de Assistência Técnica" />
    <meta property="og:description" content="SaaS modular para gestão de assistências técnicas." />
    <meta property="og:type" content="website" />
    <link rel="icon" href="./favicon.ico" type="image/x-icon" />
    <link rel="stylesheet" href="./assets/${mainCssFile}" />
    <!-- Single Page Apps for GitHub Pages (redirect restoration) -->
    <script type="text/javascript">
      (function(l) {
        if (l.search[1] === '/' ) {
          var decoded = l.search.slice(1).split('&').map(function(s) { 
            return s.replace(/~and~/g, '&')
          }).join('?');
          window.history.replaceState(null, null,
              l.pathname.slice(0, -1) + decoded + l.hash
          );
        }
      }(window.location))
    </script>
  </head>
  <body class="min-h-screen bg-background font-sans antialiased">
    <div id="root"></div>
    <script class="$tsr" id="$tsr-stream-barrier">
      (self.$R=self.$R||{})["tsr"]=[];
      self.$_TSR={h(){this.hydrated=!0,this.c()},e(){this.streamEnded=!0,this.c()},c(){this.hydrated&&this.streamEnded&&(delete self.$_TSR,delete self.$R.tsr)},p(e){this.initialized?e():this.buffer.push(e)},buffer:[]};
      $_TSR.router=($R=>$R[0]={manifest:$R[1]={routes:$R[2]={__root__:$R[3]={preloads:$R[4]=["./assets/${mainJsFile}"],scripts:$R[5]=[$R[6]={attrs:$R[7]={type:"module",async:!0,src:"./assets/${mainJsFile}"}}],css:$R[8]=[$R[9]={href:"./assets/${mainCssFile}"}]}}},matches:$R[10]=[$R[11]={i:"__root__ ",u:Date.now(),s:"success",ssr:!1}],lastMatchId:"__root__ "})($R["tsr"]);
      $_TSR.e();
      document.currentScript.remove();
    </script>
    <script type="module" async="" src="./assets/${mainJsFile}"></script>
  </body>
</html>`;

fs.writeFileSync(path.join(distDir, 'index.html'), indexHtmlContent, 'utf-8');

// 5. Generate 404.html (GitHub Pages SPA router redirector)
const notFoundHtmlContent = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>ServiceForge</title>
    <script type="text/javascript">
      // Single Page Apps for GitHub Pages
      // https://github.com/rafgraph/spa-github-pages
      var pathSegmentsToKeep = 0;
      var l = window.location;
      l.replace(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
        l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
        (l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash
      );
    </script>
  </head>
  <body>
  </body>
</html>`;

fs.writeFileSync(path.join(distDir, '404.html'), notFoundHtmlContent, 'utf-8');

// 6. Create .nojekyll file to prevent GitHub Pages from bypassing _ prefixed folders
fs.writeFileSync(path.join(distDir, '.nojekyll'), '', 'utf-8');

console.log('✅ GitHub Pages distribution ready in dist-gh-pages/');
console.log('📁 Contents:');
console.log(`   - index.html (SPA entry)`);
console.log(`   - 404.html (SPA fallback)`);
console.log(`   - .nojekyll (GitHub Pages asset unblocker)`);
console.log(`   - assets/ (${fs.readdirSync(assetsDir).length} files)`);
