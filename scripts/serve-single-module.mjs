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

function isLegacyDemoIdentity(email, name) {
  const e = String(email || '').trim().toLowerCase();
  const n = String(name || '').trim().toLowerCase();
  if (!e) return true;
  if (
    e.endsWith('@olivelas-allin.demo') ||
    e.includes('clara.monteiro') ||
    e.includes('helena.vasconcelos') ||
    e.includes('rafaela') ||
    e.includes('marta') ||
    e.includes('demo@') ||
    e.includes('admin@') ||
    n.includes('clara monteiro') ||
    n.includes('helena vasconcelos') ||
    n.includes('rafaela')
  ) {
    return true;
  }
  return false;
}

function buildSsoInjectionScript(modInfo) {
  return `<script id="olivelas-allin-sso-bootstrap">
(function() {
  try {
    var params = new URLSearchParams(window.location.search);
    var savedRaw = localStorage.getItem('allin_sso_context');
    var saved = savedRaw ? JSON.parse(savedRaw) : {};
    var rawEmail = params.get('user_email') || saved.userEmail || '';
    var rawName = params.get('user_name') || saved.userName || '';
    var isLegacy = !rawEmail ||
      rawEmail.toLowerCase().indexOf('@olivelas-allin.demo') !== -1 ||
      rawEmail.toLowerCase().indexOf('clara.monteiro') !== -1 ||
      rawEmail.toLowerCase().indexOf('helena.vasconcelos') !== -1 ||
      rawEmail.toLowerCase().indexOf('rafaela') !== -1 ||
      rawName.toLowerCase().indexOf('clara monteiro') !== -1 ||
      rawName.toLowerCase().indexOf('rafaela') !== -1;

    var companyId = params.get('company_id') || saved.companyId || 'emp-olivelas-matriz';
    var companyName = params.get('company_name') || saved.companyName || 'Olivelas Atelier & Varejo';
    var userId = isLegacy ? 'usr-super-admin' : (params.get('user_id') || saved.userId || 'usr-super-admin');
    var userEmail = isLegacy ? 'willian.o.jesus@gmail.com' : rawEmail;
    var userName = isLegacy ? 'Willian Jesus' : rawName;
    var userRole = 'GLOBAL_ADMIN';
    var instanceId = params.get('instance_id') || saved.instanceId || ('inst_' + companyId + '_${modInfo.moduleSlug}');

    if (params.has('user_email') || params.has('user_name') || params.has('allin_sso')) {
      var updated = false;
      if (params.get('user_email') !== userEmail) { params.set('user_email', userEmail); updated = true; }
      if (params.get('user_name') !== userName) { params.set('user_name', userName); updated = true; }
      if (params.get('user_id') !== userId) { params.set('user_id', userId); updated = true; }
      if (params.get('user_role') !== userRole) { params.set('user_role', userRole); updated = true; }
      if (updated && window.history && window.history.replaceState) {
        var newUrl = window.location.pathname + '?' + params.toString() + (window.location.hash || '');
        window.history.replaceState(null, '', newUrl);
      }
    }

    var ctx = {
      allinSso: '1',
      instanceId: instanceId,
      companyId: companyId,
      companyName: companyName,
      userId: userId,
      userEmail: userEmail,
      userName: userName,
      userRole: userRole,
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
        full_name: ctx.userName + ' (Super Administrador)',
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
      role: 'Super Administrador (' + ctx.companyName + ')'
    }));
    var personalAdminUser = {
      id: 'user-rafaela',
      name: ctx.userName,
      email: ctx.userEmail,
      role: 'admin',
      isPersonal: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      phone: '(11) 99812-0001',
      cref: '014820-G/SP (Global Admin)',
      specialties: ['Hipertrofia', 'Biomecânica', 'Performance'],
      status: 'Ativo',
      studentsCount: 20
    };
    localStorage.setItem('rafaela_app_current_user_v1', JSON.stringify(personalAdminUser));
    localStorage.setItem('olivelas_personal_current_user_v5', JSON.stringify(personalAdminUser));
    localStorage.setItem('olivelas_personal_users_v5', JSON.stringify([personalAdminUser]));
    localStorage.setItem('rafaela_app_users_v3', JSON.stringify([personalAdminUser]));
    localStorage.setItem('ai_survey_auth_token', 'sso-global-admin-willian');

    try {
      var routineRaw = localStorage.getItem('rotina-inteligente-state');
      if (routineRaw) {
        var routineParsed = JSON.parse(routineRaw);
        if (routineParsed && routineParsed.settings) {
          routineParsed.settings.userName = ctx.userName;
          localStorage.setItem('rotina-inteligente-state', JSON.stringify(routineParsed));
        }
      }
    } catch (err) {}

    window.__ALLIN_INSTANCE_CONTEXT__ = ctx;
    document.title = '${modInfo.brandName}';

    function enforceBrandAndFavicon() {
      if (document.title !== '${modInfo.brandName}') {
        document.title = '${modInfo.brandName}';
      }
      var links = document.querySelectorAll("link[rel*='icon']");
      var hasSvgFavicon = false;
      for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute('href') || '';
        if (href.indexOf('/favicon.svg') !== -1) {
          hasSvgFavicon = true;
        } else {
          links[i].setAttribute('href', '/favicon.svg');
          links[i].setAttribute('type', 'image/svg+xml');
          hasSvgFavicon = true;
        }
      }
      if (!hasSvgFavicon && document.head) {
        var link = document.createElement('link');
        link.rel = 'icon';
        link.type = 'image/svg+xml';
        link.href = '/favicon.svg';
        document.head.appendChild(link);
      }
    }

    function mountInstanceBadge() {
      enforceBrandAndFavicon();
      if (document.getElementById('olivelas-allin-instance-pill')) return;
      var bar = document.createElement('div');
      bar.id = 'olivelas-allin-instance-pill';
      bar.style.cssText = 'position:fixed;bottom:14px;right:14px;z-index:2147483640;display:flex;align-items:center;gap:10px;padding:7px 13px;border-radius:9999px;background:rgba(9,13,22,0.94);border:1px solid rgba(16,185,129,0.5);color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;font-size:11px;box-shadow:0 10px 25px rgba(0,0,0,0.45);backdrop-filter:blur(10px);';
      bar.innerHTML =
        '<span style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;display:inline-block;flex-shrink:0;"></span>' +
        '<span style="font-weight:700;color:#fde68a;">' + ctx.brandName + '</span>' +
        '<span style="opacity:0.4;">|</span>' +
        '<span style="font-weight:600;color:#6ee7b7;">' + ctx.companyName + '</span>' +
        '<span style="opacity:0.4;">|</span>' +
        '<span style="color:#cbd5e1;">Super Admin: <strong>' + ctx.userName + ' (' + ctx.userEmail + ')</strong></span>' +
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
    setInterval(enforceBrandAndFavicon, 1200);
  } catch (e) {
    console.warn('[AllIn SSO Bootstrap]', e);
  }
})();
</script>`;
}

function injectHtml(html, modInfo) {
  const script = buildSsoInjectionScript(modInfo);
  const faviconTag = `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />`;
  let updated = html.replace(/<link[^>]*rel=["']icon["'][^>]*>\s*(?:<path[\s\S]*?<\/svg>["']?\s*\/?>)?/gi, faviconTag);
  if (/<title>[\s\S]*?<\/title>/i.test(updated)) {
    updated = updated.replace(/<title>[\s\S]*?<\/title>/i, `<title>${modInfo.brandName}</title>`);
  }
  if (/<head[^>]*>/i.test(updated)) {
    return updated.replace(/<head[^>]*>/i, (match) => `${match}\n${faviconTag}\n${script}`);
  }
  if (updated.includes('</head>')) {
    return updated.replace('</head>', `${faviconTag}\n${script}</head>`);
  }
  if (updated.includes('</body>')) {
    return updated.replace('</body>', `${script}</body>`);
  }
  return script + updated;
}

async function startServer() {
  let nitroWorker = null;
  if (mod.type === 'nitro') {
    const ssrPath = path.join(projectDir, '.output', 'server', '_ssr', 'ssr.mjs');
    const workerPath = fs.existsSync(ssrPath)
      ? ssrPath
      : path.join(projectDir, '.output', 'server', 'index.mjs');
    const imported = await import(pathToFileURL(workerPath).href);
    const candidate =
      imported.default ||
      imported.r?.default ||
      imported.r ||
      Object.values(imported).find(
        (v) => v && (typeof v.fetch === 'function' || typeof v.default?.fetch === 'function')
      );
    nitroWorker =
      candidate && typeof candidate.fetch === 'function'
        ? candidate
        : candidate?.default && typeof candidate.default.fetch === 'function'
        ? candidate.default
        : globalThis.__nitro_vite_envs__?.ssr || imported.default;
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

      if (
        fullUrl.searchParams.has('user_email') ||
        fullUrl.searchParams.has('user_name') ||
        fullUrl.searchParams.has('allin_sso')
      ) {
        const qEmail = fullUrl.searchParams.get('user_email');
        const qName = fullUrl.searchParams.get('user_name');
        if (isLegacyDemoIdentity(qEmail, qName)) {
          fullUrl.searchParams.set('user_id', 'usr-super-admin');
          fullUrl.searchParams.set('user_email', 'willian.o.jesus@gmail.com');
          fullUrl.searchParams.set('user_name', 'Willian Jesus');
          fullUrl.searchParams.set('user_role', 'GLOBAL_ADMIN');
        }
      }

      // Redirect root '/' to adminPath if adminPath is different from '/' and request is exactement '/'
      if (pathname === '/' && mod.adminPath && mod.adminPath !== '/' && !mod.adminPath.startsWith('/?')) {
        const target = mod.adminPath + (fullUrl.search || '');
        res.writeHead(302, { Location: target });
        res.end();
        return;
      }

      // Built-in API handlers for local backend SPA projects (gerenciador_tunnel_apps, sync_google_drive, visualizador_dashboad_ai)
      if (pathname.startsWith('/api/')) {
        const sendJson = (status, data) => {
          res.writeHead(status, {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-cache',
          });
          res.end(JSON.stringify(data));
        };

        if (pathname === '/api/events') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          });
          res.write('event: connected\ndata: {"status":"ok"}\n\n');
          return;
        }

        if (pathname === '/api/health') {
          sendJson(200, { status: 'ok', port: mod.port, admin: 'willian.o.jesus@gmail.com', time: new Date().toISOString() });
          return;
        }

        if (mod.folder === 'gerenciador_tunnel_apps') {
          if (pathname === '/api/settings/status') {
            sendJson(200, {
              defaultProvider: 'cloudflared',
              lanIp: '192.168.1.100',
              adminEmail: 'willian.o.jesus@gmail.com',
              adminName: 'Willian Jesus',
              providers: {
                cloudflared: { installed: true, version: '2026.11.0', hasToken: true, protocol: 'http2' },
                ngrok: { installed: true, version: '3.18.0', hasAuthtoken: true, domain: '' },
                localtunnel: { installed: true, version: '2.0.2' },
                localhost_run: { installed: true, version: 'SSH Native' },
              },
            });
            return;
          }
          if (pathname === '/api/apps') {
            sendJson(200, [
              {
                id: 1,
                name: 'Olivelas All In Console (Port 5174)',
                local_port: 5174,
                execution_mode: 'app_and_tunnel',
                tunnel_provider: 'cloudflared',
                public_url: 'https://allin.olivelas.com.br',
                is_running: 1,
                app_status: 'running',
                tunnel_status: 'online',
                last_status: 'online',
                auto_restart: 1,
                created_at: new Date().toISOString(),
              },
              {
                id: 2,
                name: 'Olivelas - Gestão de Estoque & PDV (Port 4108)',
                local_port: 4108,
                execution_mode: 'app_and_tunnel',
                tunnel_provider: 'cloudflared',
                public_url: 'https://estoque.olivelas.com.br',
                is_running: 1,
                app_status: 'running',
                tunnel_status: 'online',
                last_status: 'online',
                auto_restart: 1,
                created_at: new Date().toISOString(),
              },
            ]);
            return;
          }
          if (pathname === '/api/notifications') {
            sendJson(200, { notifications: [], unreadCount: 0 });
            return;
          }
          if (pathname === '/api/history') {
            sendJson(200, { items: [], pagination: { page: 1, limit: 25, total: 0, totalPages: 1 } });
            return;
          }
          if (pathname === '/api/system/active-ports') {
            sendJson(200, {
              ports: [
                { port: 5174, pid: process.pid, processName: 'node (Olivelas All In)', address: '0.0.0.0:5174' },
                { port: 4108, pid: process.pid, processName: 'node (Gestão de Estoque)', address: '0.0.0.0:4108' },
              ],
            });
            return;
          }
          sendJson(200, { success: true });
          return;
        }

        if (mod.folder === 'sync_google_drive') {
          if (pathname === '/api/auth/status') {
            sendJson(200, {
              authenticated: true,
              method: 'oauth2',
              user: {
                email: 'willian.o.jesus@gmail.com',
                displayName: 'Willian Jesus (Global Admin)',
              },
              storageQuota: {
                limit: String(100 * 1024 * 1024 * 1024),
                usage: String(18 * 1024 * 1024 * 1024),
              },
            });
            return;
          }
          if (pathname === '/api/folders') {
            sendJson(200, [
              {
                id: 1,
                name: 'Backups Ecossistema Olivelas All In',
                local_path: '/home/willian/Downloads/projetos/olivelas-allin',
                remote_folder_id: 'gdrive-olivelas-root',
                remote_folder_name: 'Olivelas Cloud Backups',
                sync_direction: 'upload',
                schedule_cron: '0 */6 * * *',
                is_active: 1,
                is_syncing: 0,
                watch_enabled: 1,
                watch_delay_seconds: 10,
                last_sync_at: new Date().toISOString(),
                last_sync_status: 'success',
                last_sync_message: 'Sincronizado por Willian Jesus (willian.o.jesus@gmail.com)',
                files_synced_count: 37,
                total_bytes_synced: 15482880,
              },
            ]);
            return;
          }
          if (pathname === '/api/notifications') {
            sendJson(200, { notifications: [], unreadCount: 0 });
            return;
          }
          if (pathname === '/api/history') {
            sendJson(200, { items: [], pagination: { page: 1, limit: 30, total: 0, totalPages: 1 } });
            return;
          }
          sendJson(200, { success: true });
          return;
        }

        if (mod.folder === 'visualizador_dashboad_ai') {
          const adminUser = {
            id: '00000000-0000-0000-0000-000000000001',
            email: 'willian.o.jesus@gmail.com',
            name: 'Willian Jesus',
            role: 'GLOBAL_ADMIN',
            createdAt: '2026-01-01T00:00:00.000Z',
          };
          if (pathname === '/api/auth/me' || pathname === '/api/auth/login' || pathname === '/api/auth/register') {
            sendJson(200, {
              user: adminUser,
              token: 'sso-global-admin-willian',
              googleConfigured: true,
              googleClientEmail: 'willian.o.jesus@gmail.com',
            });
            return;
          }
          if (pathname === '/api/auth/credentials') {
            sendJson(200, {
              hasServiceAccount: true,
              clientEmail: 'willian.o.jesus@gmail.com',
              projectId: 'olivelas-allin',
              hasGoogleApiKey: true,
              hasGeminiApiKey: true,
            });
            return;
          }
          if (pathname === '/api/projects') {
            sendJson(200, {
              projects: [
                {
                  id: 'proj-olivelas-nps-2026',
                  name: 'Pesquisa Executiva de Satisfação Olivelas 2026',
                  description: 'Análise consolidada de NPS e percepção de marca Olivelas',
                  questionCount: 4,
                  respondentCount: 3,
                  updatedAt: new Date().toISOString(),
                },
              ],
            });
            return;
          }
          if (pathname === '/api/public/default-survey' || pathname.startsWith('/api/projects/')) {
            const sampleSurvey = {
              id: 'survey-olivelas-nps-2026',
              title: 'Pesquisa Executiva de Satisfação & NPS — Ecossistema Olivelas',
              description: 'Avaliação contínua de satisfação dos clientes e parceiros Olivelas (Global Admin: Willian Jesus).',
              source: 'google_forms',
              createdAt: new Date().toISOString(),
              questions: [
                { id: 'q1', text: 'Qual seu nível de satisfação geral com a plataforma Olivelas?', type: 'scale', required: true },
                { id: 'q2', text: 'Qual módulo você mais utiliza na sua operação?', type: 'single_choice', required: true },
              ],
              mappings: [
                { questionId: 'q1', columnHeader: 'Qual seu nível de satisfação geral com a plataforma Olivelas?', chartType: 'bar', category: 'Satisfação & NPS', ignore: false },
                { questionId: 'q2', columnHeader: 'Qual módulo você mais utiliza na sua operação?', chartType: 'pie', category: 'Uso de Módulos', ignore: false },
              ],
              responses: [
                { id: 'r1', submittedAt: new Date().toISOString(), answers: { q1: '10 - Excelente', q2: 'Olivelas - Gestão de Estoque & PDV' } },
                { id: 'r2', submittedAt: new Date().toISOString(), answers: { q1: '10 - Excelente', q2: 'Olivelas - Dashboard BI & Analytics' } },
                { id: 'r3', submittedAt: new Date().toISOString(), answers: { q1: '9 - Muito Bom', q2: 'Olivelas - IAM Suite & Governança' } },
              ],
            };
            sendJson(200, {
              survey: sampleSurvey,
              project: { id: 'proj-olivelas-nps-2026', name: sampleSurvey.title, survey: sampleSurvey },
              isReadOnly: false,
              isDefaultPublic: false,
              sourceName: 'Olivelas Analytics Cloud',
            });
            return;
          }
          sendJson(200, { success: true });
          return;
        }
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
