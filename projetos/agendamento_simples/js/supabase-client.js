/**
 * Olivelas - Consultório & Odonto
 * Cliente Supabase padronizado segundo a arquitetura de referência (gestao_estoque)
 * - Login Unificado: public.profiles (olivelas_supabase_auth_token)
 * - Schema Dedicado: agendamento_simples
 */
(function () {
  var runtimeEnv = (typeof window !== 'undefined' && window.__OLIVELAS_ENV__) || {};

  var OLIVELAS_SUPABASE_CONFIG = {
    url: runtimeEnv.VITE_SUPABASE_URL || localStorage.getItem('olivelas_supabase_url') || 'https://placeholder.supabase.co',
    key: runtimeEnv.VITE_SUPABASE_KEY || localStorage.getItem('olivelas_supabase_key') || 'placeholder_key',
    schema: 'agendamento_simples',
    authTable: 'public.profiles',
    storageKey: 'olivelas_supabase_auth_token',
    brandName: 'Olivelas - Consultório & Odonto',
    moduleSlug: 'allin_agendamento_simples'
  };

  window.OLIVELAS_SUPABASE_CONFIG = OLIVELAS_SUPABASE_CONFIG;

  var isConfigured =
    OLIVELAS_SUPABASE_CONFIG.url &&
    OLIVELAS_SUPABASE_CONFIG.key &&
    OLIVELAS_SUPABASE_CONFIG.url.indexOf('placeholder') === -1 &&
    OLIVELAS_SUPABASE_CONFIG.key !== 'placeholder_key';

  if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function' && isConfigured) {
    try {
      window.supabaseClient = window.supabase.createClient(
        OLIVELAS_SUPABASE_CONFIG.url,
        OLIVELAS_SUPABASE_CONFIG.key,
        {
          db: { schema: OLIVELAS_SUPABASE_CONFIG.schema },
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storageKey: OLIVELAS_SUPABASE_CONFIG.storageKey
          }
        }
      );
    } catch (err) {
      console.warn('[Olivelas Supabase] Aviso ao inicializar cliente:', err);
      window.supabaseClient = null;
    }
  } else {
    window.supabaseClient = null;
  }

  var AuthService = {
    async login(email, password) {
      if (window.supabaseClient && window.supabaseClient.auth) {
        try {
          var res = await window.supabaseClient.auth.signInWithPassword({ email: email, password: password });
          if (!res.error && res.data && res.data.session) {
            if (typeof StorageService !== 'undefined') {
              StorageService.setSession({
                id: res.data.user.id,
                name: (res.data.user.user_metadata && res.data.user.user_metadata.name) || 'Dra. Marta Gelsi Dias',
                email: res.data.user.email,
                role: 'Cirurgiã-Dentista / Administradora'
              });
            }
            return res.data;
          }
        } catch (e) {
          console.warn('[AuthService] Fallback local ativado:', e);
        }
      }

      if (!email || !password) {
        throw new Error('Informe e-mail e senha válidos.');
      }

      var fallbackUser = {
        id: 'USR-001',
        email: email,
        name: 'Dra. Marta Gelsi Dias',
        user_metadata: { name: 'Dra. Marta Gelsi Dias', role: 'admin' },
        role: 'Cirurgiã-Dentista / Administradora'
      };

      if (typeof StorageService !== 'undefined') {
        StorageService.setSession(fallbackUser);
      }

      return { user: fallbackUser, session: { user: fallbackUser } };
    },

    async getSession() {
      if (window.supabaseClient && window.supabaseClient.auth) {
        try {
          var res = await window.supabaseClient.auth.getSession();
          if (res && res.data && res.data.session) {
            return res.data.session;
          }
        } catch (e) {
          // fallback
        }
      }

      if (typeof StorageService !== 'undefined') {
        var localUser = StorageService.getSession();
        if (localUser) {
          return {
            user: {
              id: localUser.id || 'USR-001',
              email: localUser.email || 'admin@dramartagelsi.com.br',
              user_metadata: { name: localUser.name || 'Dra. Marta Gelsi Dias', role: 'admin' }
            }
          };
        }
      }

      var params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      var ssoEmail = (params && params.get('user_email')) || localStorage.getItem('allin_user_email') || 'admin@dramartagelsi.com.br';
      var ssoName = (params && params.get('user_name')) || localStorage.getItem('allin_user_name') || 'Dra. Marta Gelsi Dias';
      var ssoCompany = (params && params.get('company_name')) || localStorage.getItem('allin_company_name') || 'Olivelas Consultório Matriz';
      if (params && params.get('company_name')) {
        localStorage.setItem('allin_user_email', ssoEmail);
        localStorage.setItem('allin_user_name', ssoName);
        localStorage.setItem('allin_company_name', ssoCompany);
      }

      var defaultUser = {
        id: 'USR-001',
        email: ssoEmail,
        name: ssoName,
        role: 'Cirurgiã-Dentista / Administradora (' + ssoCompany + ')',
        user_metadata: { name: ssoName, role: 'admin', company: ssoCompany }
      };
      if (typeof StorageService !== 'undefined') {
        StorageService.setSession(defaultUser);
      }
      return { user: defaultUser };
    },

    async getUser() {
      var session = await AuthService.getSession();
      return session ? session.user : null;
    },

    async logout() {
      if (window.supabaseClient && window.supabaseClient.auth) {
        try {
          await window.supabaseClient.auth.signOut();
        } catch (e) {
          // ignore
        }
      }
      if (typeof StorageService !== 'undefined') {
        StorageService.clearSession();
      }
      var isInsidePages = window.location.pathname.indexOf('/pages/') !== -1;
      window.location.href = isInsidePages ? '../login.html' : 'login.html';
    }
  };

  window.AuthService = AuthService;

  window.queryModuleTable = async function (table, companyId) {
    var cid = companyId || 'comp_nebula';
    if (!isConfigured) return [];
    var response = await fetch(
      OLIVELAS_SUPABASE_CONFIG.url + '/rest/v1/' + table + '?company_id=eq.' + cid + '&select=*',
      {
        headers: {
          apikey: OLIVELAS_SUPABASE_CONFIG.key,
          Authorization: 'Bearer ' + OLIVELAS_SUPABASE_CONFIG.key,
          'Accept-Profile': OLIVELAS_SUPABASE_CONFIG.schema
        },
        credentials: 'omit'
      }
    );
    return response.ok ? response.json() : [];
  };

  window.queryUnifiedProfiles = async function () {
    if (!isConfigured) return [];
    var response = await fetch(OLIVELAS_SUPABASE_CONFIG.url + '/rest/v1/profiles?select=*', {
      headers: {
        apikey: OLIVELAS_SUPABASE_CONFIG.key,
        Authorization: 'Bearer ' + OLIVELAS_SUPABASE_CONFIG.key,
        'Accept-Profile': 'public'
      },
      credentials: 'omit'
    });
    return response.ok ? response.json() : [];
  };
})();
