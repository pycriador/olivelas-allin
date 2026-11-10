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

function parseCookies(cookieHeader) {
  const map = {};
  if (!cookieHeader) return map;
  const parts = String(cookieHeader).split(';');
  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      try {
        map[k] = decodeURIComponent(v);
      } catch {
        map[k] = v;
      }
    }
  }
  return map;
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
  const hasSeparateLanding = Boolean(
    modInfo.landingPath && modInfo.landingPath !== modInfo.adminPath
  );
  const isSinglePageStatic = Boolean(
    modInfo.isStaticPage && (!modInfo.landingPath || modInfo.landingPath === modInfo.adminPath)
  );
  const initialLayer = modInfo.activeLayer || 'admin';
  const targetInternalPath =
    initialLayer === 'landing' && modInfo.landingPath
      ? modInfo.landingPath
      : initialLayer === 'login' && modInfo.loginPath
      ? modInfo.loginPath
      : modInfo.adminPath || '/';

  return `<script id="olivelas-allin-sso-bootstrap">
(function() {
  try {
    var nativeReplaceState = window.history && window.history.replaceState
      ? window.history.replaceState.bind(window.history)
      : null;

    var params = new URLSearchParams(window.location.search);
    var savedRaw = localStorage.getItem('allin_sso_context');
    var saved = savedRaw ? JSON.parse(savedRaw) : {};

    // Read shared SSO cookie if present
    var cookieMatch = document.cookie.match(/(?:^|;\\s*)allin_sso_session=([^;]+)/);
    if (cookieMatch && cookieMatch[1]) {
      try {
        var cookieData = JSON.parse(decodeURIComponent(cookieMatch[1]));
        if (cookieData && typeof cookieData === 'object') {
          saved = Object.assign({}, saved, cookieData);
        }
      } catch (err) {}
    }

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

    var ctx = {
      allinSso: '1',
      sessionActive: true,
      instanceId: instanceId,
      companyId: companyId,
      companyName: companyName,
      userId: userId,
      userEmail: userEmail,
      userName: userName,
      userRole: userRole,
      moduleSlug: '${modInfo.moduleSlug}',
      folder: '${modInfo.folder}',
      brandName: '${modInfo.brandName}',
      port: ${modInfo.port}
    };

    localStorage.setItem('allin_sso_context', JSON.stringify(ctx));
    localStorage.setItem('allin_sso_session_active', 'true');
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

    document.cookie = 'allin_sso_active=1; path=/; max-age=2592000; SameSite=Lax';

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
    window.__ALLIN_INITIAL_LAYER__ = '${initialLayer}';
    var currentLayer = params.get('layer') || '${initialLayer}';
    if (currentLayer !== 'landing' && currentLayer !== 'login' && currentLayer !== 'admin') {
      currentLayer = 'admin';
    }
    localStorage.setItem('allin_active_layer_${modInfo.port}', currentLayer);
    document.cookie = 'allin_layer_${modInfo.port}=' + currentLayer + '; path=/; max-age=2592000; SameSite=Lax';

    var cleanAppUrl = '/${modInfo.folder}';
    var modType = '${modInfo.type}';
    var targetRoute = '${targetInternalPath}';

    // Before SPA/Nitro router mounts, ensure window.location matches expected route without SSO query clutter
    if (nativeReplaceState) {
      if (modType === 'vanilla') {
        nativeReplaceState(window.history.state, '', cleanAppUrl);
      } else {
        var curPath = window.location.pathname;
        if (curPath === '/' || curPath === '/${modInfo.folder}' || curPath === '/${modInfo.moduleSlug}') {
          nativeReplaceState(window.history.state, '', targetRoute);
        } else if (window.location.search) {
          var cleanSearch = new URLSearchParams(window.location.search);
          ['allin_sso','instance_id','company_id','company_name','user_id','user_email','user_name','user_role','layer'].forEach(function(k) {
            cleanSearch.delete(k);
          });
          var qs = cleanSearch.toString();
          nativeReplaceState(window.history.state, '', curPath + (qs ? '?' + qs : '') + (window.location.hash || ''));
        }
      }
    }

    function applyCleanAppUrlInAddressBar() {
      if (!nativeReplaceState) return;
      if (window.location.pathname !== cleanAppUrl || window.location.search !== '') {
        nativeReplaceState(window.history.state, '', cleanAppUrl);
      }
    }

    if (modType !== 'vanilla') {
      window.addEventListener('load', function() {
        setTimeout(applyCleanAppUrlInAddressBar, 450);
        setTimeout(applyCleanAppUrlInAddressBar, 1200);
      });
    }

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
      if (modType === 'vanilla') {
        applyCleanAppUrlInAddressBar();
      }
    }

    function neutralizeNativeLoginIfNeeded() {
      var hints = document.querySelectorAll('.mock-credential-hint, [data-mock-credentials]');
      for (var h = 0; h < hints.length; h++) {
        hints[h].remove();
      }
      if (currentLayer !== 'login') return;
      var forms = document.querySelectorAll('form');
      for (var i = 0; i < forms.length; i++) {
        forms[i].onsubmit = function(e) {
          if (e) { e.preventDefault(); e.stopPropagation(); }
          return false;
        };
      }
      var inputs = document.querySelectorAll('input, button[type="submit"], select, textarea');
      for (var j = 0; j < inputs.length; j++) {
        var el = inputs[j];
        if (el.closest && el.closest('#olivelas-allin-instance-pill')) continue;
        if (el.closest && el.closest('#olivelas-allin-layer-overlay')) continue;
        if (el.tagName === 'INPUT' && (el.type === 'email' || el.type === 'password' || el.type === 'text')) {
          el.value = '';
          el.setAttribute('value', '');
        }
        el.setAttribute('disabled', 'disabled');
        el.setAttribute('readonly', 'readonly');
        el.style.pointerEvents = 'none';
        el.style.opacity = '0.65';
      }
    }

    function renderLayerOverlay(layer) {
      var existing = document.getElementById('olivelas-allin-layer-overlay');
      if (existing) existing.remove();

      var hasNativeLanding = ${hasSeparateLanding ? 'true' : 'false'};
      var isSingleStatic = ${isSinglePageStatic ? 'true' : 'false'};
      var hasNativeLogin = ${modInfo.loginPath ? 'true' : 'false'};

      // Determine if an overlay is needed for this layer
      var needsLoginOverlay = (layer === 'login' && !hasNativeLogin);
      var needsLandingOverlay = (layer === 'landing' && !hasNativeLanding && !isSingleStatic);
      var needsStaticAdminOverlay = (layer === 'admin' && isSingleStatic);

      if (layer === 'login' && hasNativeLogin) {
        neutralizeNativeLoginIfNeeded();
        var topNotice = document.getElementById('olivelas-allin-readonly-login-banner');
        if (!topNotice && document.body) {
          topNotice = document.createElement('div');
          topNotice.id = 'olivelas-allin-readonly-login-banner';
          topNotice.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483630;background:linear-gradient(90deg,#1e1b4b,#312e81,#1e1b4b);border-bottom:1px solid rgba(167,139,250,0.45);color:#f8fafc;padding:10px 20px;display:flex;align-items:center;justify-content:center;gap:12px;font-family:system-ui,-apple-system,sans-serif;font-size:12px;box-shadow:0 8px 25px rgba(0,0,0,0.35);';
          topNotice.innerHTML =
            '<span style="padding:3px 8px;border-radius:9999px;background:rgba(245,158,11,0.2);border:1px solid rgba(245,158,11,0.5);color:#fde68a;font-weight:700;font-size:11px;">🔒 SOMENTE VISUALIZAÇÃO (SEM FUNCIONALIDADE)</span>' +
            '<span>Esta tela de login está em modo de demonstração visual. Sua sessão SSO já está ativa como <strong>' + ctx.userName + '</strong>.</span>';
          document.body.appendChild(topNotice);
        }
        return;
      } else {
        var oldBanner = document.getElementById('olivelas-allin-readonly-login-banner');
        if (oldBanner) oldBanner.remove();
      }

      if (!needsLoginOverlay && !needsLandingOverlay && !needsStaticAdminOverlay) {
        return;
      }

      var overlay = document.createElement('div');
      overlay.id = 'olivelas-allin-layer-overlay';
      overlay.style.cssText = 'position:fixed;inset:0;z-index:2147483620;overflow-y:auto;background:radial-gradient(circle at 20% 15%, #0f172a 0%, #090d16 65%, #050811 100%);color:#f8fafc;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;padding:32px 20px 100px;';

      if (needsLoginOverlay) {
        overlay.innerHTML =
          '<div style="max-width:480px;margin:36px auto 0;background:rgba(15,23,42,0.92);border:1px solid rgba(148,163,184,0.22);border-radius:20px;padding:32px;box-shadow:0 25px 60px rgba(0,0,0,0.65);backdrop-filter:blur(16px);">' +
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:20px;padding:8px 12px;border-radius:10px;background:rgba(245,158,11,0.12);border:1px solid rgba(245,158,11,0.35);">' +
              '<span style="font-size:11px;font-weight:700;color:#fde68a;letter-spacing:0.03em;">🔒 TELA DE LOGIN — SOMENTE VISUALIZAÇÃO (SEM FUNCIONALIDADE)</span>' +
            '</div>' +
            '<div style="text-align:center;margin-bottom:24px;">' +
              '<div style="width:56px;height:56px;margin:0 auto 12px;border-radius:14px;background:rgba(16,185,129,0.12);border:1px solid rgba(16,185,129,0.35);display:flex;align-items:center;justify-content:center;">' +
                '<img src="/favicon.svg" alt="Logo" style="width:34px;height:34px;" />' +
              '</div>' +
              '<h1 style="margin:0;font-size:20px;font-weight:800;color:#f8fafc;">' + ctx.brandName + '</h1>' +
              '<p style="margin:6px 0 0;font-size:13px;color:#94a3b8;">Acesso Corporativo • ' + ctx.companyName + '</p>' +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:14px;opacity:0.75;pointer-events:none;user-select:none;">' +
              '<div>' +
                '<label style="display:block;font-size:12px;font-weight:600;color:#cbd5e1;margin-bottom:6px;">E-mail</label>' +
                '<input type="email" disabled readonly value="" placeholder="Informe seu e-mail" style="width:100%;box-sizing:border-box;padding:11px 14px;border-radius:10px;background:#090d16;border:1px solid #334155;color:#94a3b8;font-size:13px;cursor:not-allowed;" />' +
              '</div>' +
              '<div>' +
                '<div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:6px;">' +
                  '<label style="font-weight:600;color:#cbd5e1;">Senha</label>' +
                  '<span style="color:#64748b;">Autenticação via SSO</span>' +
                '</div>' +
                '<input type="password" disabled readonly value="" placeholder="Informe sua senha" style="width:100%;box-sizing:border-box;padding:11px 14px;border-radius:10px;background:#090d16;border:1px solid #334155;color:#94a3b8;font-size:13px;cursor:not-allowed;" />' +
              '</div>' +
              '<button type="button" disabled style="margin-top:4px;width:100%;padding:12px;border-radius:10px;background:#1e293b;border:1px solid #475569;color:#94a3b8;font-weight:700;font-size:13px;cursor:not-allowed;">' +
                'Entrar na Plataforma (Desabilitado — Visualização)' +
              '</button>' +
            '</div>' +
            '<div style="margin-top:22px;padding:14px;border-radius:12px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);display:flex;flex-direction:column;gap:8px;">' +
              '<div style="display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:#6ee7b7;">' +
                '<span style="width:8px;height:8px;border-radius:50%;background:#10b981;display:inline-block;"></span>' +
                'Sessão SSO Já Autenticada e Ativa' +
              '</div>' +
              '<p style="margin:0;font-size:12px;color:#cbd5e1;line-height:1.5;">Você já está autenticado como <strong>' + ctx.userName + '</strong> com perfil <strong>GLOBAL_ADMIN</strong>. Use a barra inferior para alternar para a <strong>Landing Page</strong> ou <strong>Administração (SSO)</strong>.</p>' +
              '<div style="display:flex;gap:8px;margin-top:4px;">' +
                '<button type="button" data-switch-layer="landing" style="flex:1;padding:8px 10px;border-radius:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#f8fafc;font-size:12px;font-weight:600;cursor:pointer;">🌐 Ir para Landing Page</button>' +
                '<button type="button" data-switch-layer="admin" style="flex:1;padding:8px 10px;border-radius:8px;background:#10b981;border:none;color:#052e16;font-size:12px;font-weight:700;cursor:pointer;">🛡️ Ir para Administração (SSO)</button>' +
              '</div>' +
            '</div>' +
          '</div>';
      } else if (needsLandingOverlay) {
        overlay.innerHTML =
          '<div style="max-width:960px;margin:20px auto 0;">' +
            '<header style="display:flex;align-items:center;justify-content:space-between;padding:16px 24px;border-radius:16px;background:rgba(15,23,42,0.85);border:1px solid rgba(148,163,184,0.18);margin-bottom:32px;">' +
              '<div style="display:flex;align-items:center;gap:12px;">' +
                '<img src="/favicon.svg" alt="Logo" style="width:36px;height:36px;" />' +
                '<div>' +
                  '<div style="font-size:16px;font-weight:800;color:#f8fafc;">' + ctx.brandName + '</div>' +
                  '<div style="font-size:11px;color:#94a3b8;">Camada Pública • Landing Page & Apresentação Comercial</div>' +
                '</div>' +
              '</div>' +
              '<div style="display:flex;align-items:center;gap:10px;">' +
                '<button type="button" data-switch-layer="login" style="padding:9px 14px;border-radius:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);color:#e2e8f0;font-size:12px;font-weight:600;cursor:pointer;">🔒 Ver Tela de Login</button>' +
                '<button type="button" data-switch-layer="admin" style="padding:9px 16px;border-radius:10px;background:#10b981;border:none;color:#052e16;font-size:12px;font-weight:800;cursor:pointer;">🛡️ Acessar Administração (SSO)</button>' +
              '</div>' +
            '</header>' +
            '<section style="padding:48px 36px;border-radius:24px;background:linear-gradient(135deg,rgba(16,185,129,0.14) 0%,rgba(15,23,42,0.95) 55%,rgba(30,27,75,0.85) 100%);border:1px solid rgba(16,185,129,0.3);text-align:center;margin-bottom:28px;">' +
              '<span style="display:inline-block;padding:5px 12px;border-radius:9999px;background:rgba(16,185,129,0.18);border:1px solid rgba(16,185,129,0.4);color:#6ee7b7;font-size:11px;font-weight:700;margin-bottom:16px;">ECOSSISTEMA OLIVELAS ALL IN • CAMADA LANDING PAGE</span>' +
              '<h1 style="margin:0 0 14px;font-size:34px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">' + ctx.brandName + '</h1>' +
              '<p style="max-width:640px;margin:0 auto 28px;font-size:15px;color:#cbd5e1;line-height:1.6;">Plataforma integrada ao ecossistema multiempresa <strong>' + ctx.companyName + '</strong> com autenticação única (SSO), alta disponibilidade e governança centralizada para o Super Administrador <strong>' + ctx.userName + '</strong>.</p>' +
              '<div style="display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;">' +
                '<button type="button" data-switch-layer="admin" style="padding:13px 24px;border-radius:12px;background:#10b981;border:none;color:#052e16;font-size:14px;font-weight:800;cursor:pointer;box-shadow:0 10px 25px rgba(16,185,129,0.3);">🛡️ Entrar no Painel Administrativo (SSO Ativo)</button>' +
                '<button type="button" data-switch-layer="login" style="padding:13px 20px;border-radius:12px;background:rgba(15,23,42,0.8);border:1px solid rgba(148,163,184,0.3);color:#f8fafc;font-size:14px;font-weight:600;cursor:pointer;">🔒 Visualizar Tela de Login</button>' +
              '</div>' +
            '</section>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px;">' +
              '<div style="padding:22px;border-radius:16px;background:rgba(15,23,42,0.8);border:1px solid rgba(148,163,184,0.16);">' +
                '<div style="font-size:13px;font-weight:700;color:#fde68a;margin-bottom:6px;">⚡ Single Sign-On (SSO) Nativo</div>' +
                '<p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">Sessão persistente autenticada automaticamente para <strong>' + ctx.userEmail + '</strong> sem parâmetros expostos na URL.</p>' +
              '</div>' +
              '<div style="padding:22px;border-radius:16px;background:rgba(15,23,42,0.8);border:1px solid rgba(148,163,184,0.16);">' +
                '<div style="font-size:13px;font-weight:700;color:#6ee7b7;margin-bottom:6px;">🏢 Multiempresa & Isolamento</div>' +
                '<p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">Instância dedicada vinculada à organização <strong>' + ctx.companyName + '</strong> na porta <strong>:' + ctx.port + '</strong>.</p>' +
              '</div>' +
              '<div style="padding:22px;border-radius:16px;background:rgba(15,23,42,0.8);border:1px solid rgba(148,163,184,0.16);">' +
                '<div style="font-size:13px;font-weight:700;color:#c4b5fd;margin-bottom:6px;">🔄 Navegação em 3 Camadas</div>' +
                '<p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">Alterne a qualquer momento entre Landing Page, Tela de Login (Visualização) e Administração na barra inferior.</p>' +
              '</div>' +
            '</div>' +
          '</div>';
      } else if (needsStaticAdminOverlay) {
        overlay.innerHTML =
          '<div style="max-width:960px;margin:20px auto 0;">' +
            '<header style="display:flex;align-items:center;justify-content:space-between;padding:18px 24px;border-radius:16px;background:rgba(15,23,42,0.9);border:1px solid rgba(16,185,129,0.35);margin-bottom:24px;">' +
              '<div style="display:flex;align-items:center;gap:12px;">' +
                '<img src="/favicon.svg" alt="Logo" style="width:36px;height:36px;" />' +
                '<div>' +
                  '<div style="display:flex;align-items:center;gap:8px;">' +
                    '<span style="font-size:17px;font-weight:800;color:#f8fafc;">' + ctx.brandName + '</span>' +
                    '<span style="padding:2px 8px;border-radius:9999px;background:rgba(16,185,129,0.2);color:#6ee7b7;font-size:10px;font-weight:700;">ADMINISTRAÇÃO SSO • PÁGINA ESTÁTICA</span>' +
                  '</div>' +
                  '<div style="font-size:12px;color:#94a3b8;margin-top:2px;">Super Administrador: <strong>' + ctx.userName + ' (' + ctx.userEmail + ')</strong> • ' + ctx.companyName + '</div>' +
                '</div>' +
              '</div>' +
              '<button type="button" data-switch-layer="landing" style="padding:10px 16px;border-radius:10px;background:#10b981;border:none;color:#052e16;font-size:12px;font-weight:800;cursor:pointer;">🌐 Ver Vitrine / Landing Page ao Vivo</button>' +
            '</header>' +
            '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;margin-bottom:24px;">' +
              '<div style="padding:20px;border-radius:16px;background:rgba(15,23,42,0.85);border:1px solid rgba(148,163,184,0.18);">' +
                '<div style="font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:700;">Status da Página Estática</div>' +
                '<div style="font-size:20px;font-weight:800;color:#10b981;margin-top:6px;">Publicada & Online (:' + ctx.port + ')</div>' +
                '<div style="font-size:12px;color:#cbd5e1;margin-top:6px;">URL Limpa Ativa: <code>/' + ctx.folder + '</code></div>' +
              '</div>' +
              '<div style="padding:20px;border-radius:16px;background:rgba(15,23,42,0.85);border:1px solid rgba(148,163,184,0.18);">' +
                '<div style="font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:700;">Autenticação & Governança</div>' +
                '<div style="font-size:20px;font-weight:800;color:#fde68a;margin-top:6px;">GLOBAL_ADMIN Ativo</div>' +
                '<div style="font-size:12px;color:#cbd5e1;margin-top:6px;">Sessão SSO: <code>' + ctx.userEmail + '</code></div>' +
              '</div>' +
              '<div style="padding:20px;border-radius:16px;background:rgba(15,23,42,0.85);border:1px solid rgba(148,163,184,0.18);">' +
                '<div style="font-size:11px;color:#94a3b8;text-transform:uppercase;font-weight:700;">Arquitetura do Módulo</div>' +
                '<div style="font-size:20px;font-weight:800;color:#f8fafc;margin-top:6px;">Frontend Estático</div>' +
                '<div style="font-size:12px;color:#cbd5e1;margin-top:6px;">Sem dependência de banco de dados externo</div>' +
              '</div>' +
            '</div>' +
            '<div style="padding:24px;border-radius:16px;background:rgba(15,23,42,0.85);border:1px solid rgba(148,163,184,0.18);">' +
              '<h3 style="margin:0 0 10px;font-size:15px;color:#f8fafc;">Painel de Controle da Aplicação Estática</h3>' +
              '<p style="margin:0 0 16px;font-size:13px;color:#94a3b8;line-height:1.6;">Esta aplicação é classificada como <strong>Página Estática</strong> (frontend puro). Para interagir com a vitrine pública da aplicação, clique em <strong>Landing Page</strong> abaixo ou na barra inferior.</p>' +
              '<div style="display:flex;gap:10px;flex-wrap:wrap;">' +
                '<button type="button" data-switch-layer="landing" style="padding:10px 18px;border-radius:10px;background:#10b981;border:none;color:#052e16;font-size:13px;font-weight:800;cursor:pointer;">🌐 Abrir Camada Landing Page</button>' +
                '<button type="button" data-switch-layer="login" style="padding:10px 18px;border-radius:10px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.18);color:#f8fafc;font-size:13px;font-weight:600;cursor:pointer;">🔒 Visualizar Tela de Login (Somente Leitura)</button>' +
              '</div>' +
            '</div>' +
          '</div>';
      }

      document.body.appendChild(overlay);
      var switchBtns = overlay.querySelectorAll('[data-switch-layer]');
      for (var k = 0; k < switchBtns.length; k++) {
        switchBtns[k].onclick = function() {
          var target = this.getAttribute('data-switch-layer');
          if (target) switchApplicationLayer(target);
        };
      }
    }

    function updateBottomBarActiveState() {
      var bar = document.getElementById('olivelas-allin-instance-pill');
      if (!bar) return;
      var btns = bar.querySelectorAll('[data-layer-btn]');
      for (var i = 0; i < btns.length; i++) {
        var bLayer = btns[i].getAttribute('data-layer-btn');
        var isActive = bLayer === currentLayer;
        if (isActive) {
          btns[i].style.background = bLayer === 'login' ? 'rgba(245,158,11,0.25)' : 'rgba(16,185,129,0.28)';
          btns[i].style.borderColor = bLayer === 'login' ? '#f59e0b' : '#10b981';
          btns[i].style.color = bLayer === 'login' ? '#fde68a' : '#6ee7b7';
          btns[i].style.fontWeight = '700';
        } else {
          btns[i].style.background = 'rgba(255,255,255,0.05)';
          btns[i].style.borderColor = 'rgba(148,163,184,0.25)';
          btns[i].style.color = '#cbd5e1';
          btns[i].style.fontWeight = '500';
        }
      }
    }

    function switchApplicationLayer(nextLayer) {
      if (nextLayer !== 'landing' && nextLayer !== 'login' && nextLayer !== 'admin') return;
      currentLayer = nextLayer;
      localStorage.setItem('allin_active_layer_${modInfo.port}', nextLayer);
      document.cookie = 'allin_layer_${modInfo.port}=' + nextLayer + '; path=/; max-age=2592000; SameSite=Lax';
      updateBottomBarActiveState();

      var hasNativeLanding = ${hasSeparateLanding ? 'true' : 'false'};
      var hasNativeLogin = ${modInfo.loginPath ? 'true' : 'false'};
      var initialLoadedLayer = window.__ALLIN_INITIAL_LAYER__ || 'admin';

      // If switching to login and there is no separate login HTML file, just show overlay immediately
      if (nextLayer === 'login' && !hasNativeLogin) {
        renderLayerOverlay('login');
        applyCleanAppUrlInAddressBar();
        return;
      }

      // If switching between native files/routes (e.g. landing <-> admin on 4129 or 4101 or Nitro/SPA with landingPath)
      if (
        (nextLayer === 'landing' && hasNativeLanding && initialLoadedLayer !== 'landing') ||
        (nextLayer === 'admin' && hasNativeLanding && initialLoadedLayer !== 'admin') ||
        (nextLayer === 'login' && hasNativeLogin && initialLoadedLayer !== 'login') ||
        (nextLayer !== 'login' && hasNativeLogin && initialLoadedLayer === 'login')
      ) {
        window.location.href = '/${modInfo.folder}?layer=' + nextLayer;
        return;
      }

      renderLayerOverlay(nextLayer);
      applyCleanAppUrlInAddressBar();
    }

    window.__ALLIN_SWITCH_LAYER__ = switchApplicationLayer;

    function mountInstanceBadge() {
      enforceBrandAndFavicon();
      renderLayerOverlay(currentLayer);
      if (document.getElementById('olivelas-allin-instance-pill')) {
        updateBottomBarActiveState();
        return;
      }
      var bar = document.createElement('div');
      bar.id = 'olivelas-allin-instance-pill';
      bar.style.cssText = 'position:fixed;bottom:12px;left:50%;transform:translateX(-50%);z-index:2147483645;display:flex;align-items:center;flex-wrap:wrap;justify-content:center;gap:8px;padding:7px 14px;border-radius:9999px;background:rgba(9,13,22,0.96);border:1px solid rgba(16,185,129,0.55);color:#f8fafc;font-family:system-ui,-apple-system,sans-serif;font-size:11px;box-shadow:0 12px 32px rgba(0,0,0,0.6);backdrop-filter:blur(12px);max-width:96vw;';
      bar.innerHTML =
        '<div style="display:flex;align-items:center;gap:7px;">' +
          '<span style="width:8px;height:8px;border-radius:50%;background:#10b981;box-shadow:0 0 8px #10b981;display:inline-block;flex-shrink:0;" title="Sessão SSO Ativa"></span>' +
          '<span style="font-weight:700;color:#fde68a;white-space:nowrap;">' + ctx.brandName + '</span>' +
          (${modInfo.isStaticPage ? 'true' : 'false'} ? '<span style="padding:2px 6px;border-radius:9999px;background:rgba(148,163,184,0.2);color:#e2e8f0;font-size:10px;font-weight:600;white-space:nowrap;">Página Estática</span>' : '') +
        '</div>' +
        '<span style="opacity:0.35;">|</span>' +
        '<div style="display:flex;align-items:center;gap:5px;" role="group" aria-label="Camadas da Aplicação">' +
          '<span style="color:#94a3b8;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-right:2px;">Camadas:</span>' +
          '<button type="button" data-layer-btn="landing" title="Acessar camada Landing Page / Vitrine Pública" style="padding:4px 10px;border-radius:9999px;border:1px solid rgba(148,163,184,0.25);background:rgba(255,255,255,0.05);color:#cbd5e1;font-size:11px;cursor:pointer;transition:all 0.15s;white-space:nowrap;">🌐 Landing Page</button>' +
          '<button type="button" data-layer-btn="login" title="Tela de login (somente visualização e sem funcionalidade)" style="padding:4px 10px;border-radius:9999px;border:1px solid rgba(148,163,184,0.25);background:rgba(255,255,255,0.05);color:#cbd5e1;font-size:11px;cursor:pointer;transition:all 0.15s;white-space:nowrap;">🔒 Tela de Login (Visualização)</button>' +
          '<button type="button" data-layer-btn="admin" title="Acessar Tela de Administração com SSO ativo" style="padding:4px 10px;border-radius:9999px;border:1px solid rgba(148,163,184,0.25);background:rgba(255,255,255,0.05);color:#cbd5e1;font-size:11px;cursor:pointer;transition:all 0.15s;white-space:nowrap;">🛡️ Administração (SSO)</button>' +
        '</div>' +
        '<span style="opacity:0.35;">|</span>' +
        '<span style="color:#cbd5e1;white-space:nowrap;font-size:10.5px;">SSO Ativo: <strong style="color:#6ee7b7;">' + ctx.userName + '</strong> <span style="opacity:0.75;">(' + ctx.userEmail + ')</span></span>';

      document.body.appendChild(bar);
      updateBottomBarActiveState();

      var layerBtns = bar.querySelectorAll('[data-layer-btn]');
      for (var i = 0; i < layerBtns.length; i++) {
        layerBtns[i].onclick = function() {
          var targetLayer = this.getAttribute('data-layer-btn');
          if (targetLayer) switchApplicationLayer(targetLayer);
        };
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
  const baseTag =
    modInfo.baseHref && !/<base\s/i.test(html)
      ? `<base href="${modInfo.baseHref}" />`
      : '';
  let updated = html.replace(
    /<link[^>]*rel=["']icon["'][^>]*>\s*(?:<path[\s\S]*?<\/svg>["']?\s*\/?>)?/gi,
    faviconTag
  );
  if (/<title>[\s\S]*?<\/title>/i.test(updated)) {
    updated = updated.replace(/<title>[\s\S]*?<\/title>/i, `<title>${modInfo.brandName}</title>`);
  }
  if (/<head[^>]*>/i.test(updated)) {
    return updated.replace(
      /<head[^>]*>/i,
      (match) => `${match}\n${baseTag ? baseTag + '\n' : ''}${faviconTag}\n${script}`
    );
  }
  if (updated.includes('</head>')) {
    return updated.replace(
      '</head>',
      `${baseTag ? baseTag + '\n' : ''}${faviconTag}\n${script}</head>`
    );
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

      const cookies = parseCookies(req.headers.cookie);
      const layerCookieName = `allin_layer_${mod.port}`;
      let activeLayer = cookies[layerCookieName] || 'admin';

      // Explicit ?layer= query parameter overrides and persists the active layer
      const requestedLayer = fullUrl.searchParams.get('layer');
      if (
        requestedLayer === 'landing' ||
        requestedLayer === 'login' ||
        requestedLayer === 'admin'
      ) {
        activeLayer = requestedLayer;
      } else if (mod.type === 'vanilla') {
        if (
          pathname === '/index.html' &&
          mod.adminPath &&
          mod.adminPath !== '/index.html'
        ) {
          activeLayer = 'landing';
        } else if (
          pathname === '/admin/index.html' ||
          pathname === '/admin/' ||
          pathname === '/pages/dashboard.html'
        ) {
          activeLayer = 'admin';
        } else if (pathname === '/login.html') {
          activeLayer = 'login';
        }
      }

      if (activeLayer !== 'landing' && activeLayer !== 'login' && activeLayer !== 'admin') {
        activeLayer = 'admin';
      }

      const setCookieHeaders = [
        `${layerCookieName}=${activeLayer}; Path=/; Max-Age=2592000; SameSite=Lax`,
        `allin_sso_active=1; Path=/; Max-Age=2592000; SameSite=Lax`,
      ];

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

      const isAppSlugRoute =
        pathname === '/' ||
        pathname === `/${mod.folder}` ||
        pathname === `/${mod.moduleSlug}`;

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
          sendJson(200, {
            status: 'ok',
            port: mod.port,
            admin: 'willian.o.jesus@gmail.com',
            time: new Date().toISOString(),
          });
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

      // Resolve target static HTML file when visiting '/', '/<folder>', or '/admin/'
      let effectiveStaticPathname = pathname;
      if (mod.type === 'vanilla') {
        if (isAppSlugRoute) {
          if (activeLayer === 'landing' && mod.landingPath) {
            effectiveStaticPathname = mod.landingPath;
          } else if (activeLayer === 'login' && mod.loginPath) {
            effectiveStaticPathname = mod.loginPath;
          } else {
            effectiveStaticPathname = mod.adminPath || '/index.html';
          }
        } else if (pathname === '/admin' || pathname === '/admin/') {
          effectiveStaticPathname = '/admin/index.html';
        }
      } else if (isAppSlugRoute) {
        effectiveStaticPathname = '/index.html';
      }

      let candidatePath = path.join(
        staticRoot,
        effectiveStaticPathname === '/' ? 'index.html' : effectiveStaticPathname
      );
      if (
        effectiveStaticPathname === '/favicon.svg' &&
        (!fs.existsSync(candidatePath) || !fs.statSync(candidatePath).isFile())
      ) {
        const fallbackFavicon = path.join(ROOT_DIR, 'projetos', mod.folder, 'favicon.svg');
        if (fs.existsSync(fallbackFavicon)) {
          candidatePath = fallbackFavicon;
        }
      }
      if (
        (candidatePath.startsWith(staticRoot) || effectiveStaticPathname === '/favicon.svg') &&
        fs.existsSync(candidatePath) &&
        fs.statSync(candidatePath).isFile()
      ) {
        const ext = path.extname(candidatePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';
        if (ext === '.html') {
          const relDir = path
            .dirname(path.relative(staticRoot, candidatePath))
            .replace(/\\/g, '/');
          const baseHref = relDir === '.' || relDir === '' ? '/' : `/${relDir}/`;
          const rawHtml = fs.readFileSync(candidatePath, 'utf8');
          const outHtml = injectHtml(rawHtml, {
            ...mod,
            activeLayer,
            baseHref: mod.type === 'vanilla' ? baseHref : undefined,
          });
          res.writeHead(200, {
            'Content-Type': contentType,
            'Cache-Control': 'no-cache',
            'Set-Cookie': setCookieHeaders,
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

        let ssrTargetUrl = fullUrl;
        if (isAppSlugRoute) {
          const targetRoute =
            activeLayer === 'landing' && mod.landingPath
              ? mod.landingPath
              : mod.adminPath || '/';
          ssrTargetUrl = new URL(targetRoute, `http://${host}`);
        }

        let webReq = new Request(ssrTargetUrl.toString(), {
          method: req.method || 'GET',
          headers,
          body: bodyBuf,
        });

        let webRes = await nitroWorker.fetch(webReq, process.env, {
          waitUntil: () => {},
          passThroughOnException: () => {},
        });

        // Follow internal SSR redirects on the server so the browser URL stays clean at /<folder>
        let redirectHops = 0;
        while (
          [301, 302, 303, 307, 308].includes(webRes.status) &&
          webRes.headers.get('location') &&
          redirectHops < 4
        ) {
          const nextLoc = webRes.headers.get('location');
          const nextUrl = new URL(nextLoc, `http://${host}`);
          webReq = new Request(nextUrl.toString(), {
            method: 'GET',
            headers,
          });
          webRes = await nitroWorker.fetch(webReq, process.env, {
            waitUntil: () => {},
            passThroughOnException: () => {},
          });
          redirectHops++;
        }

        const resHeaders = {};
        webRes.headers.forEach((v, k) => {
          resHeaders[k] = v;
        });
        resHeaders['Set-Cookie'] = setCookieHeaders;

        const cType = webRes.headers.get('content-type') || '';
        if (cType.includes('text/html')) {
          const rawHtml = await webRes.text();
          const outHtml = injectHtml(rawHtml, {
            ...mod,
            activeLayer,
          });
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
          const outHtml = injectHtml(rawHtml, {
            ...mod,
            activeLayer,
          });
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Set-Cookie': setCookieHeaders,
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
      `✅ [${mod.port}] ${mod.brandName} (${mod.folder}) -> http://localhost:${mod.port}/${mod.folder}`
    );
  });
}

startServer();
