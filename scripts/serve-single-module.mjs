#!/usr/bin/env node
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

const configJson = process.argv[2];
if (!configJson) {
  console.error('Usage: node serve-single-module.mjs <configJson>');
  process.exit(1);
}

const mod = JSON.parse(configJson);
const projectDir = mod.projectDir;

// Load .env from projectDir if present
const envPath = path.join(projectDir, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const k = trimmed.slice(0, eqIdx).trim();
      const v = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

function buildSsoInjectionScript(modInfo) {
  return `<script id="olivelas-allin-sso-bootstrap">
(function() {
  try {
    var params = new URLSearchParams(window.location.search);
    var savedRaw = localStorage.getItem('allin_sso_context');
    var saved = savedRaw ? JSON.parse(savedRaw) : {};
    var ctx = {
      allinSso: params.get('allin_sso') || saved.allinSso || '1',
      instanceId: params.get('instance_id') || saved.instanceId || ('inst_' + (params.get('company_id') || saved.companyId || 'comp_nebula') + '_${modInfo.moduleSlug}'),
      companyId: params.get('company_id') || saved.companyId || 'comp_nebula',
      companyName: params.get('company_name') || saved.companyName || 'Olivelas Nebula Holdings',
      userId: params.get('user_id') || saved.userId || 'usr-admin-global',
      userEmail: params.get('user_email') || saved.userEmail || 'willian.o.jesus@gmail.com',
      userName: params.get('user_name') || saved.userName || 'Willian Jesus',
      userRole: params.get('user_role') || saved.userRole || 'GLOBAL_ADMIN',
      moduleSlug: '${modInfo.moduleSlug}',
      brandName: '${modInfo.brandName}'
    };
    localStorage.setItem('allin_sso_context', JSON.stringify(ctx));
    localStorage.setItem('allin_company_id', ctx.companyId);
    localStorage.setItem('allin_company_name', ctx.companyName);
    localStorage.setItem('allin_user_name', ctx.userName);
    localStorage.setItem('allin_user_email', ctx.userEmail);
    localStorage.setItem('sf.demoSession', 'true');
    localStorage.setItem('olivelas-demo-user', 'true');
    localStorage.setItem('olivelas_demo_user', JSON.stringify({
      id: '00000000-0000-0000-0000-000000000001',
      email: ctx.userEmail,
      name: ctx.userName,
      createdAt: new Date().toISOString()
    }));
    localStorage.setItem('marketflow_auth_session', JSON.stringify({
      user: { id: 'user-willian-global', email: ctx.userEmail },
      profile: {
        id: 'user-willian-global',
        full_name: ctx.userName + ' (' + ctx.companyName + ')',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }));
    localStorage.setItem('olivelas_user_profile', JSON.stringify({
      id: ctx.userId,
      email: ctx.userEmail,
      fullName: ctx.userName,
      avatarUrl: null,
      phone: null,
      isGlobalAdmin: true,
      createdAt: new Date().toISOString()
    }));
    localStorage.setItem('olivelas_user_stores', JSON.stringify([{
      id: ctx.instanceId,
      storeId: ctx.companyId,
      storeName: ctx.companyName,
      storeSlug: ctx.companyId,
      role: 'GLOBAL_ADMIN',
      isActive: true
    }]));
    localStorage.setItem('olivelas_active_store_id', ctx.companyId);
    localStorage.setItem('marta_gelsi_session', JSON.stringify({
      id: 'USR-001',
      email: ctx.userEmail,
      name: ctx.userName,
      role: 'Administrador (' + ctx.companyName + ')'
    }));

    window.__ALLIN_INSTANCE_CONTEXT__ = ctx;

    function mountInstanceBadge() {
      if (document.getElementById('olivelas-allin-instance-pill')) return;
      var bar = document.createElement('div');
      bar.id = 'olivelas-allin-instance-pill';
      bar.style.cssText = 'position:fixed;bottom:14px;right:14px;z-index:2147483640;display:flex;align-items:center;gap:10px;padding:7px 13px;border-radius:9999px;background:rgba(9,13,22,0.92);border:1px solid rgba(16,185,129,0.45);color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;font-size:11px;box-shadow:0 10px 25px rgba(0,0,0,0.45);backdrop-filter:blur(10px);';
      bar.innerHTML =
        '<span style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;display:inline-block;flex-shrink:0;"></span>' +
        '<span style="font-weight:700;color:#6ee7b7;">Instância: ' + ctx.companyName + '</span>' +
        '<span style="opacity:0.4;">|</span>' +
        '<span style="color:#cbd5e1;">SSO All In: <strong>' + ctx.userName + '</strong></span>' +
        '<span style="opacity:0.4;">|</span>' +
        '<code style="font-size:10px;color:#94a3b8;background:rgba(255,255,255,0.07);padding:2px 6px;border-radius:6px;">' + ctx.instanceId + '</code>' +
        '<button id="olivelas-allin-pill-close" title="Ocultar indicador de instância" style="margin-left:4px;background:none;border:none;color:#94a3b8;cursor:pointer;font-size:13px;line-height:1;padding:0 2px;">×</button>';
      document.body.appendChild(bar);
      var closeBtn = document.getElementById('olivelas-allin-pill-close');
      if (closeBtn) {
        closeBtn.onclick = function() { bar.style.display = 'none'; };
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mountInstanceBadge);
    } else {
      mountInstanceBadge();
    }
  } catch (e) {
    console.warn('[AllIn SSO Bootstrap]', e);
  }
})();
</script>`;
}

function injectHtml(html, modInfo) {
  const script = buildSsoInjectionScript(modInfo);
  if (html.includes('</head>')) {
    return html.replace('</head>', `${script}</head>`);
  }
  if (html.includes('</body>')) {
    return html.replace('</body>', `${script}</body>`);
  }
  return script + html;
}

async function startServer() {
  let nitroWorker = null;
  if (mod.type === 'nitro') {
    const workerPath = path.join(projectDir, '.output', 'server', 'index.mjs');
    const imported = await import(pathToFileURL(workerPath).href);
    nitroWorker = imported.default;
  }

  const staticRoot =
    mod.type === 'nitro'
      ? path.join(projectDir, '.output', 'public')
      : mod.type === 'spa'
      ? path.join(projectDir, 'dist')
      : projectDir;

  const server = http.createServer(async (req, res) => {
    try {
      const host = req.headers.host || `localhost:${mod.port}`;
      const fullUrl = new URL(req.url || '/', `http://${host}`);
      let pathname = decodeURIComponent(fullUrl.pathname);

      // Redirect root '/' to adminPath if adminPath is different from '/' and request is exactement '/'
      if (pathname === '/' && mod.adminPath && mod.adminPath !== '/' && !mod.adminPath.startsWith('/?')) {
        const target = mod.adminPath + (fullUrl.search || '');
        res.writeHead(302, { Location: target });
        res.end();
        return;
      }

      // Check static file first
      const candidatePath = path.join(staticRoot, pathname === '/' ? 'index.html' : pathname);
      if (
        candidatePath.startsWith(staticRoot) &&
        fs.existsSync(candidatePath) &&
        fs.statSync(candidatePath).isFile()
      ) {
        const ext = path.extname(candidatePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        if (ext === '.html') {
          const rawHtml = fs.readFileSync(candidatePath, 'utf8');
          const outHtml = injectHtml(rawHtml, mod);
          res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache',
          });
          res.end(outHtml);
          return;
        }
        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(candidatePath).pipe(res);
        return;
      }

      // If Nitro SSR app, delegate to Nitro worker
      if (mod.type === 'nitro' && nitroWorker) {
        const headers = new Headers();
        for (const [k, v] of Object.entries(req.headers)) {
          if (Array.isArray(v)) {
            for (const item of v) headers.append(k, item);
          } else if (typeof v === 'string') {
            headers.set(k, v);
          }
        }

        let bodyBuf = undefined;
        if (req.method !== 'GET' && req.method !== 'HEAD') {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          bodyBuf = Buffer.concat(chunks);
        }

        const webReq = new Request(fullUrl.toString(), {
          method: req.method || 'GET',
          headers,
          body: bodyBuf,
        });

        const webRes = await nitroWorker.fetch(webReq, process.env, {
          waitUntil: () => {},
          passThroughOnException: () => {},
        });

        const resHeaders = {};
        webRes.headers.forEach((v, k) => {
          resHeaders[k] = v;
        });

        const cType = webRes.headers.get('content-type') || '';
        if (cType.includes('text/html')) {
          const rawHtml = await webRes.text();
          const outHtml = injectHtml(rawHtml, mod);
          delete resHeaders['content-length'];
          res.writeHead(webRes.status, resHeaders);
          res.end(outHtml);
          return;
        }

        const arrayBuf = await webRes.arrayBuffer();
        res.writeHead(webRes.status, resHeaders);
        res.end(Buffer.from(arrayBuf));
        return;
      }

      // If SPA, fallback to index.html
      if (mod.type === 'spa') {
        const indexHtmlPath = path.join(staticRoot, 'index.html');
        if (fs.existsSync(indexHtmlPath)) {
          const rawHtml = fs.readFileSync(indexHtmlPath, 'utf8');
          const outHtml = injectHtml(rawHtml, mod);
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache',
          });
          res.end(outHtml);
          return;
        }
      }

      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    } catch (err) {
      console.error(`[${mod.folder}:${mod.port}] Error handling ${req.url}:`, err);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal Server Error');
    }
  });

  server.listen(mod.port, '0.0.0.0', () => {
    console.log(
      `✅ [${mod.port}] ${mod.brandName} (${mod.folder}) -> http://localhost:${mod.port}${mod.adminPath}`
    );
  });
}

startServer();
