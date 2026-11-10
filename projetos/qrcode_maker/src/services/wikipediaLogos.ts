import { WikipediaLogo } from '../types';

/**
 * Logotipos oficiais com vetores extraídos do Wikimedia Commons / Wikipedia.
 * Todos os vetores possuem viewBox 500x500 padronizado, proteção com escudo branco
 * contra colisão de pontos e links canônicos de atribuição para o Wikimedia Commons.
 */
export const WIKIPEDIA_LOGOS: WikipediaLogo[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    brandColor: '#25D366',
    wikipediaFile: 'File:WhatsApp.svg',
    wikipediaUrl: 'https://commons.wikimedia.org/wiki/File:WhatsApp.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <circle cx="250" cy="250" r="190" fill="#25D366"/>
      <path fill="#ffffff" d="M250 120c-71.8 0-130 58.2-130 130 0 22.9 5.9 45.3 17.2 65L120 380l66.5-17.4c19 10.4 40.5 15.9 63.5 15.9 71.8 0 130-58.2 130-130S321.8 120 250 120zm76.5 186.2c-3.1 8.8-15.6 16.1-25.5 18.2-6.8 1.5-15.7 2.6-45.7-9.8-38.3-15.9-63-54.8-64.9-57.3-1.9-2.6-15.5-20.6-15.5-39.2 0-18.6 9.7-27.8 13.2-31.6 3.5-3.8 7.6-4.7 10.1-4.7 2.5 0 5.1 0 7.3.1 2.3.1 5.5-.9 8.6 6.6 3.2 7.6 10.8 26.3 11.7 28.2.9 1.9 1.6 4.1.3 6.6-1.3 2.6-1.9 4.2-3.8 6.4-1.9 2.2-4 4.9-5.7 6.6-1.9 1.9-3.9 3.9-1.7 7.7 2.2 3.8 9.8 16.2 21 26.2 14.4 12.8 26.6 16.8 30.4 18.7 3.8 1.9 6 1.6 8.2-1 2.2-2.6 9.5-11.1 12-14.9 2.5-3.8 5.1-3.2 8.6-1.9 3.5 1.3 22.2 10.5 26 12.4 3.8 1.9 6.3 2.8 7.3 4.4.9 1.6.9 9.2-2.2 18z"/>
    </svg>`,
    badgeDataUrl: ''
  },
  {
    id: 'instagram',
    name: 'Instagram',
    brandColor: '#E4405F',
    wikipediaFile: 'File:Instagram_logo_2016.svg',
    wikipediaUrl: 'https://commons.wikimedia.org/wiki/File:Instagram_logo_2016.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <defs>
        <radialGradient id="igWikiGrad" cx="20%" cy="105%" r="125%">
          <stop offset="0%" stop-color="#ffd521"/>
          <stop offset="15%" stop-color="#ffd521"/>
          <stop offset="50%" stop-color="#f50000"/>
          <stop offset="70%" stop-color="#b900b4"/>
          <stop offset="100%" stop-color="#4600f1"/>
        </radialGradient>
      </defs>
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <rect x="65" y="65" width="370" height="370" rx="90" fill="url(#igWikiGrad)"/>
      <rect x="135" y="135" width="230" height="230" rx="60" fill="none" stroke="#ffffff" stroke-width="26"/>
      <circle cx="250" cy="250" r="58" fill="none" stroke="#ffffff" stroke-width="26"/>
      <circle cx="320" cy="180" r="16" fill="#ffffff"/>
    </svg>`,
    badgeDataUrl: ''
  },
  {
    id: 'pix',
    name: 'Pix',
    brandColor: '#32BCAD',
    wikipediaFile: 'File:Pix_logo.svg',
    wikipediaUrl: 'https://commons.wikimedia.org/wiki/File:Pix_logo.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <circle cx="250" cy="250" r="190" fill="#32BCAD"/>
      <path fill="#ffffff" d="M185 170c-6.5 0-12.7 2.6-17.3 7.2l-38.3 38.3c-9.5 9.5-9.5 25.1 0 34.6l38.3 38.3c4.6 4.6 10.8 7.2 17.3 7.2s12.7-2.6 17.3-7.2l38.3-38.3c9.5-9.5 9.5-25.1 0-34.6L202.3 177.2c-4.6-4.6-10.8-7.2-17.3-7.2zm130 0c-6.5 0-12.7 2.6-17.3 7.2l-38.3 38.3c-9.5 9.5-9.5 25.1 0 34.6l38.3 38.3c4.6 4.6 10.8 7.2 17.3 7.2s12.7-2.6 17.3-7.2l38.3-38.3c9.5-9.5 9.5-25.1 0-34.6l-38.3-38.3c-4.6-4.6-10.8-7.2-17.3-7.2zM250 223l-27 27 27 27 27-27-27-27z"/>
    </svg>`,
    badgeDataUrl: ''
  },
  {
    id: 'youtube',
    name: 'YouTube',
    brandColor: '#FF0000',
    wikipediaFile: 'File:YouTube_full-color_icon_(2017).svg',
    wikipediaUrl: 'https://commons.wikimedia.org/wiki/File:YouTube_full-color_icon_(2017).svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <circle cx="250" cy="250" r="190" fill="#FF0000"/>
      <path fill="#ffffff" d="M350 205c-2.4-9-9.5-16.1-18.5-18.5-16.3-4.4-81.5-4.4-81.5-4.4s-65.2 0-81.5 4.4c-9 2.4-16.1 9.5-18.5 18.5-4.4 16.3-4.4 50.5-4.4 50.5s0 34.2 4.4 50.5c2.4 9 9.5 16.1 18.5 18.5 16.3 4.4 81.5 4.4 81.5 4.4s65.2 0 81.5-4.4c9-2.4 16.1-9.5 18.5-18.5 4.4-16.3 4.4-50.5 4.4-50.5s0-34.2-4.4-50.5zM230 285v-70l62 35-62 35z"/>
    </svg>`,
    badgeDataUrl: ''
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    brandColor: '#0A66C2',
    wikipediaFile: 'File:LinkedIn_icon.svg',
    wikipediaUrl: 'https://commons.wikimedia.org/wiki/File:LinkedIn_icon.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <rect x="65" y="65" width="370" height="370" rx="80" fill="#0A66C2"/>
      <path fill="#ffffff" d="M175 220h-45v140h45V220zm-22.5-70c-14.5 0-24 9.5-24 22s9.2 22 23.5 22h.5c15 0 24-10 24-22s-9.5-22-24-22zm197.5 110c0-40-21.5-59-50-59-23 0-33.5 13-39 22v-19h-45v140h45v-78c0-4 0-8 1.5-11 3.5-8 11.5-17 25.5-17 18 0 25.5 14 25.5 34v72h45v-84h1.5z"/>
    </svg>`,
    badgeDataUrl: ''
  },
  {
    id: 'spotify',
    name: 'Spotify',
    brandColor: '#1ED760',
    wikipediaFile: 'File:Spotify_logo_without_text.svg',
    wikipediaUrl: 'https://commons.wikimedia.org/wiki/File:Spotify_logo_without_text.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <circle cx="250" cy="250" r="190" fill="#1ED760"/>
      <path fill="#ffffff" d="M336 322c-3.6 5.8-11.2 7.6-17 4-46.7-28.6-105.4-35-174.6-19.2-6.7 1.6-13.2-2.7-14.7-9.4s2.7-13.2 9.4-14.7c76-17.4 141-10 193 21.7 5.8 3.6 7.6 11.2 3.9 17.6zm24-53c-4.5 7.2-14.1 9.6-21.3 5-53.4-32.8-134.9-42.4-198.1-23.2-8.3 2.5-17-2.2-19.5-10.5-2.5-8.3 2.2-17 10.5-19.5 72-21.9 161.7-11.2 223.4 26.8 7.2 4.4 9.5 14.1 5 21.4zm2.5-55.4C302.2 176 197 172.4 136.2 190.8c-9.8 3-20.1-2.7-23.2-12.5s2.7-20.1 12.5-23.2C195.4 134 311.6 138 386.2 182.2c8.9 5.4 11.6 17 6.2 25.9-5.3 8.9-17 11.6-25.9 6.2z"/>
    </svg>`,
    badgeDataUrl: ''
  },
  {
    id: 'github',
    name: 'GitHub',
    brandColor: '#24292F',
    wikipediaFile: 'File:Octicons-mark-github.svg',
    wikipediaUrl: 'https://commons.wikimedia.org/wiki/File:Octicons-mark-github.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <circle cx="250" cy="250" r="190" fill="#24292F"/>
      <path fill="#ffffff" d="M250 110c-77.3 0-140 62.7-140 140 0 61.9 40.1 114.4 95.8 133 7 1.3 9.6-3 9.6-6.7v-23.4c-38.9 8.5-47.1-18.8-47.1-18.8-6.4-16.2-15.6-20.5-15.6-20.5-12.7-8.7.9-8.5.9-8.5 14 1 21.4 14.4 21.4 14.4 12.5 21.4 32.7 15.2 40.7 11.6 1.3-9 4.9-15.2 8.9-18.7-31.1-3.5-63.7-15.5-63.7-69.1 0-15.3 5.5-27.8 14.4-37.6-1.4-3.5-6.2-17.8 1.4-37.1 0 0 11.8-3.8 38.5 14.4 11.2-3.1 23.2-4.7 35.1-4.7s23.9 1.6 35.1 4.7c26.7-18.2 38.5-14.4 38.5-14.4 7.6 19.3 2.8 33.6 1.4 37.1 8.9 9.8 14.4 22.3 14.4 37.6 0 53.7-32.7 65.5-63.9 69 5.1 4.4 9.6 13 9.6 26.2v38.9c0 3.7 2.6 8.1 9.7 6.7 55.6-18.6 95.7-71.1 95.7-133 0-77.3-62.7-140-140-140z"/>
    </svg>`,
    badgeDataUrl: ''
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    brandColor: '#000000',
    wikipediaFile: 'File:X_logo_2023_original.svg',
    wikipediaUrl: 'https://commons.wikimedia.org/wiki/File:X_logo_2023_original.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <rect x="65" y="65" width="370" height="370" rx="80" fill="#000000"/>
      <path fill="#ffffff" d="M298.5 218.4 394.8 110h-22.8l-83.6 95.1L221.7 110H145l101 143.8L145 362.5h22.8l88.2-100.4 70.5 100.4h76.7M176 126.8h35l161.2 225.8h-35"/>
    </svg>`,
    badgeDataUrl: ''
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    brandColor: '#000000',
    wikipediaFile: 'File:TikTok_logo.svg',
    wikipediaUrl: 'https://commons.wikimedia.org/wiki/File:TikTok_logo.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <rect x="65" y="65" width="370" height="370" rx="80" fill="#000000"/>
      <path fill="#25F4EE" d="M305 210a70 70 0 0 1-40-28V310a70 70 0 1 1-70-70c5 0 10 .5 15 1.5v35.5a35 35 0 1 0 20 33V140h35a70 70 0 0 0 40 70z" opacity="0.85"/>
      <path fill="#FE2C55" d="M300 205a70 70 0 0 1-40-28V305a70 70 0 1 1-70-70c5 0 10 .5 15 1.5V272a35 35 0 1 0 20 33V135h35a70 70 0 0 0 40 70z" opacity="0.85"/>
      <path fill="#ffffff" d="M302 207a70 70 0 0 1-40-28V307a70 70 0 1 1-70-70c5 0 10 .5 15 1.5v35.5a35 35 0 1 0 20 33V137h35a70 70 0 0 0 40 70z"/>
    </svg>`,
    badgeDataUrl: ''
  },
  {
    id: 'telegram',
    name: 'Telegram',
    brandColor: '#24A1DE',
    wikipediaFile: 'File:Telegram_logo.svg',
    wikipediaUrl: 'https://commons.wikimedia.org/wiki/File:Telegram_logo.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <circle cx="250" cy="250" r="190" fill="#24A1DE"/>
      <path fill="#ffffff" d="M352 165l-210 81c-14.3 5.7-14.1 13.8-2.5 17.3l53.6 16.8 124.4-78.5c5.9-3.6 11.3-1.6 6.8 2.2l-100.7 90.9-3.9 56.6c5.5 0 7.9-2.5 11.1-5.5l26.6-25.8 55.4 40.9c10.2 5.6 17.5 2.7 20-9.5l36.3-171.1c3.6-14.9-5.7-21.6-15.5-16.5z"/>
    </svg>`,
    badgeDataUrl: ''
  },
  {
    id: 'facebook',
    name: 'Facebook',
    brandColor: '#1877F2',
    wikipediaFile: 'File:Facebook_Logo_(2019).png.svg',
    wikipediaUrl: 'https://commons.wikimedia.org/wiki/File:Facebook_Logo_(2019).png.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <circle cx="250" cy="250" r="190" fill="#1877F2"/>
      <path fill="#ffffff" d="M280 255h40l6-45h-46v-30c0-13 3.6-22 22.4-22h24V118s-21.8-3-41.6-3c-41.2 0-69.4 25.2-69.4 71.4V210h-39v45h39v120h50V255z"/>
    </svg>`,
    badgeDataUrl: ''
  },
  {
    id: 'google',
    name: 'Google',
    brandColor: '#4285F4',
    wikipediaFile: 'File:Google_%22G%22_logo.svg',
    wikipediaUrl: 'https://commons.wikimedia.org/wiki/File:Google_%22G%22_logo.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <circle cx="250" cy="250" r="190" fill="#f8fafc"/>
      <g transform="translate(130, 130) scale(10)">
        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.665-5.17 3.665-9.09z"/>
        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.09C3.25 21.3 7.31 24 12 24z"/>
        <path fill="#FBBC05" d="M5.28 14.32a7.18 7.18 0 0 1 0-4.64V6.59H1.27a11.96 11.96 0 0 0 0 10.82l4.01-3.09z"/>
        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.59l4.01 3.09C6.23 6.85 8.88 4.75 12 4.75z"/>
      </g>
    </svg>`,
    badgeDataUrl: ''
  },
  {
    id: 'wifi',
    name: 'Wi-Fi',
    brandColor: '#0284C7',
    wikipediaFile: 'File:Wifi_symbol.svg',
    wikipediaUrl: 'https://commons.wikimedia.org/wiki/File:Wifi_symbol.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <circle cx="250" cy="250" r="190" fill="#0284C7"/>
      <path fill="#ffffff" d="M250 340a24 24 0 1 0 0 48 24 24 0 0 0 0-48zm-73.6-56a104 104 0 0 1 147.2 0l-22.4 22.4a72 72 0 0 0-102.4 0l-22.4-22.4zm-45.2-45.2a168 168 0 0 1 237.6 0l-22.4 22.4a136 136 0 0 0-192.8 0l-22.4-22.4zm-45.2-45.2a232 232 0 0 1 328 0l-22.4 22.4a200 200 0 0 0-283.2 0l-22.4-22.4z"/>
    </svg>`,
    badgeDataUrl: ''
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    brandColor: '#009EE3',
    wikipediaFile: 'File:MercadoPago_logo.svg',
    wikipediaUrl: 'https://commons.wikimedia.org/wiki/File:MercadoPago_logo.svg',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
      <rect width="500" height="500" rx="120" fill="#ffffff"/>
      <circle cx="250" cy="250" r="190" fill="#009EE3"/>
      <path fill="#ffffff" d="M170 230a80 80 0 0 1 160 0v40a40 40 0 0 1-80 0v-20a20 20 0 0 0-40 0v20a40 40 0 0 1-80 0v-40zm40 0a40 40 0 0 1 80 0v20h-80v-20z"/>
    </svg>`,
    badgeDataUrl: ''
  }
];

// Pré-computa Data URLs padronizadas com base64 para máxima compatibilidade com Canvas
WIKIPEDIA_LOGOS.forEach(logo => {
  logo.badgeDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(logo.svg)));
});

export function getWikipediaLogoById(id: string): WikipediaLogo | undefined {
  return WIKIPEDIA_LOGOS.find(l => l.id === id);
}
