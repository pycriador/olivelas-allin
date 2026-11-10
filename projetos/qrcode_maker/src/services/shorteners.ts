import { ShortenerProvider } from '../types';

/**
 * Utilitário de requisição JSONP para navegadores.
 * Bypassa 100% de restrições CORS em qualquer ambiente sem necessidade de servidores proxy.
 */
function jsonpShorten(endpoint: string, timeoutMs = 6000): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.document) {
      reject(new Error('JSONP indisponível fora do navegador'));
      return;
    }

    const callbackName = '__olivelas_jsonp_' + Math.random().toString(36).substring(2, 9);
    const script = document.createElement('script');
    
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Tempo limite da requisição JSONP esgotado'));
    }, timeoutMs);

    const cleanup = () => {
      clearTimeout(timer);
      if (script.parentNode) script.parentNode.removeChild(script);
      delete (window as any)[callbackName];
    };

    (window as any)[callbackName] = (data: any) => {
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      cleanup();
      reject(new Error('Falha no carregamento do script JSONP'));
    };

    const separator = endpoint.includes('?') ? '&' : '?';
    script.src = `${endpoint}${separator}callback=${callbackName}`;
    document.head.appendChild(script);
  });
}

/**
 * Fetch seguro com timeout rápido de 4.5s
 */
async function quickFetch(url: string, options: RequestInit = {}, timeoutMs = 4500): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Provedores verificados de encurtamento com suporte a CORS nativo e fallback automático
 */
export const URL_SHORTENERS: ShortenerProvider[] = [
  {
    id: 'isgd',
    name: 'is.gd',
    domain: 'is.gd',
    shorten: async (url: string) => {
      const endpoint = `https://is.gd/create.php?format=json&url=${encodeURIComponent(url)}`;
      try {
        const res = await quickFetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          if (data && data.shorturl) return data.shorturl;
        }
      } catch {}
      // Fallback JSONP para navegadores
      const jp = await jsonpShorten(endpoint);
      if (jp && jp.shorturl) return jp.shorturl;
      throw new Error('Falha no is.gd');
    }
  },
  {
    id: 'vgd',
    name: 'v.gd',
    domain: 'v.gd',
    shorten: async (url: string) => {
      const endpoint = `https://v.gd/create.php?format=json&url=${encodeURIComponent(url)}`;
      try {
        const res = await quickFetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          if (data && data.shorturl) return data.shorturl;
        }
      } catch {}
      const jp = await jsonpShorten(endpoint);
      if (jp && jp.shorturl) return jp.shorturl;
      throw new Error('Falha no v.gd');
    }
  },
  {
    id: 'dagd',
    name: 'da.gd',
    domain: 'da.gd',
    shorten: async (url: string) => {
      const endpoint = `https://da.gd/s?url=${encodeURIComponent(url)}`;
      const res = await quickFetch(endpoint);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const text = (await res.text()).trim();
      if (text.startsWith('http')) return text;
      throw new Error('Resposta inválida do da.gd');
    }
  },
  {
    id: 'clckru',
    name: 'Clck.ru',
    domain: 'clck.ru',
    shorten: async (url: string) => {
      const endpoint = `https://clck.ru/--?url=${encodeURIComponent(url)}`;
      const res = await quickFetch(endpoint);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const text = (await res.text()).trim();
      if (text.startsWith('http')) return text;
      throw new Error('Resposta inválida do Clck.ru');
    }
  },
  {
    id: 'tinyurl',
    name: 'TinyURL',
    domain: 'tinyurl.com',
    shorten: async (url: string) => {
      const endpoint = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;
      const res = await quickFetch(endpoint);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const text = (await res.text()).trim();
      if (text.startsWith('http')) return text;
      throw new Error('Resposta inválida do TinyURL');
    }
  },
  {
    id: 'ulvis',
    name: 'Ulvis.net',
    domain: 'ulvis.net',
    shorten: async (url: string) => {
      const endpoint = `https://ulvis.net/api.php?url=${encodeURIComponent(url)}`;
      const res = await quickFetch(endpoint);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const text = (await res.text()).trim();
      if (text.startsWith('http')) return text;
      throw new Error('Resposta inválida do Ulvis');
    }
  },
  {
    id: 'spoo',
    name: 'Spoo.me',
    domain: 'spoo.me',
    shorten: async (url: string) => {
      const endpoint = 'https://spoo.me/';
      const res = await quickFetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: `url=${encodeURIComponent(url)}`
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (data && data.short_url) return data.short_url;
      throw new Error('Resposta inválida do Spoo.me');
    }
  },
  {
    id: 'chilpit',
    name: 'Chilp.it',
    domain: 'chilp.it',
    shorten: async (url: string) => {
      const endpoint = `https://chilp.it/api.php?url=${encodeURIComponent(url)}`;
      const res = await quickFetch(endpoint);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const text = (await res.text()).trim();
      if (text.startsWith('http')) return text;
      throw new Error('Resposta inválida do Chilp.it');
    }
  },
  {
    id: 'cleanuri',
    name: 'CleanURI',
    domain: 'cleanuri.com',
    shorten: async (url: string) => {
      const endpoint = 'https://cleanuri.com/api/v1/shorten';
      const res = await quickFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `url=${encodeURIComponent(url)}`
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (data && data.result_url) return data.result_url;
      throw new Error('Falha no CleanURI');
    }
  },
  {
    id: 'onept',
    name: '1pt.co',
    domain: '1pt.co',
    shorten: async (url: string) => {
      const endpoint = `https://1pt.co/api/create?url=${encodeURIComponent(url)}`;
      const res = await quickFetch(endpoint);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (data && data.short) return `https://1pt.co/${data.short}`;
      throw new Error('Falha no 1pt.co');
    }
  },
  {
    id: 'tnyim',
    name: 'tny.im',
    domain: 'tny.im',
    shorten: async (url: string) => {
      const endpoint = `https://tny.im/yourls-api.php?action=shorturl&format=json&url=${encodeURIComponent(url)}`;
      const res = await quickFetch(endpoint);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (data && data.shorturl) return data.shorturl;
      throw new Error('Falha no tny.im');
    }
  }
];

/**
 * Executa encurtamento seguro com cascata transparente de fallback.
 * Se o provedor selecionado pelo usuário sofrer bloqueio de CORS pelo navegador ou estiver indisponível,
 * recorre imediatamente aos encurtadores de CORS nativo (is.gd, v.gd, da.gd, clck.ru).
 */
export async function shortenUrlWithFallback(
  url: string,
  preferredProviderId: string = 'isgd'
): Promise<{ shortUrl: string; providerName: string; usedFallback: boolean }> {
  // 1. Provedor selecionado
  const primaryProvider = URL_SHORTENERS.find(p => p.id === preferredProviderId) || URL_SHORTENERS[0];

  try {
    const res = await primaryProvider.shorten(url);
    if (res && res.startsWith('http')) {
      return { shortUrl: res, providerName: primaryProvider.name, usedFallback: false };
    }
  } catch (primaryErr) {
    console.warn(`[Olivelas Shortener] Provedor ${primaryProvider.name} falhou ou bloqueado por CORS. Ativando cascata de alta disponibilidade...`, primaryErr);
  }

  // 2. Cascata com provedores com suporte garantido a CORS no navegador
  const fallbackList = ['isgd', 'vgd', 'dagd', 'clckru'].filter(id => id !== preferredProviderId);

  for (const fallbackId of fallbackList) {
    const provider = URL_SHORTENERS.find(p => p.id === fallbackId);
    if (!provider) continue;

    try {
      const short = await provider.shorten(url);
      if (short && short.startsWith('http')) {
        return { shortUrl: short, providerName: provider.name, usedFallback: true };
      }
    } catch (fallbackErr) {
      console.warn(`[Olivelas Shortener] Cascata tentou ${provider.name} sem sucesso. Passando para o próximo...`);
    }
  }

  throw new Error('Todos os serviços de encurtamento temporariamente indisponíveis.');
}
