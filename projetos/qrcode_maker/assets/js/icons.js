/**
 * Olivelas QR Code - Ícones SVG de alta fidelidade
 * Usados tanto na interface quanto como logotipos embutidos no centro do QR Code.
 */
window.QR_ICONS = {
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    color: '#25D366',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    badgeSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="48" fill="#25D366"/>
      <path fill="#ffffff" d="M50 18C32.33 18 18 32.33 18 50c0 5.64 1.46 11.14 4.24 16L19 81l15.42-3.17c4.7 2.58 10 3.94 15.58 3.94 17.67 0 32-14.33 32-32S67.67 18 50 18zm17.6 44.4c-.73 2.05-3.64 3.75-5.96 4.25-1.59.34-3.66.61-10.66-2.29-8.94-3.71-14.7-12.78-15.15-13.38-.45-.6-3.61-4.8-3.61-9.15 0-4.35 2.27-6.49 3.08-7.37.81-.88 1.77-1.1 2.36-1.1.59 0 1.18.01 1.7.03.55.03 1.29-.21 2.02 1.54.74 1.77 2.51 6.13 2.73 6.57.22.44.37.96.07 1.55-.29.6-.44.97-.88 1.49-.44.51-.93 1.15-1.33 1.54-.44.44-.9.92-.39 1.8 1.2 2.08 2.67 3.73 4.88 5.7 2.84 2.53 5.23 3.32 5.97 3.69.74.37 1.18.31 1.62-.2.44-.51 1.91-2.22 2.42-2.98.51-.76 1.03-.63 1.73-.37.7.26 4.45 2.1 5.22 2.48.77.38 1.28.57 1.47.89.18.32.18 1.86-.55 3.91z"/>
    </svg>`
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    color: '#E4405F',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>`,
    badgeSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <defs>
        <radialGradient id="igRad" cx="20%" cy="105%" r="120%">
          <stop offset="0%" stop-color="#fdf497"/>
          <stop offset="10%" stop-color="#fdf497"/>
          <stop offset="50%" stop-color="#fd5949"/>
          <stop offset="70%" stop-color="#d6249f"/>
          <stop offset="100%" stop-color="#285AEB"/>
        </radialGradient>
      </defs>
      <rect width="96" height="96" x="2" y="2" rx="28" fill="url(#igRad)"/>
      <rect width="60" height="60" x="20" y="20" rx="16" fill="none" stroke="#ffffff" stroke-width="6"/>
      <circle cx="50" cy="50" r="14" fill="none" stroke="#ffffff" stroke-width="6"/>
      <circle cx="67" cy="33" r="3.5" fill="#ffffff"/>
    </svg>`
  },
  pix: {
    id: 'pix',
    name: 'Pix',
    color: '#32BCAD',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 2 12l10 10 10-10L12 2z"/><path d="M7 12h10"/><path d="M12 7v10"/></svg>`,
    badgeSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="48" fill="#32BCAD"/>
      <path fill="#ffffff" d="M37.5 30.6l-9 9a7.2 7.2 0 0 0 0 10.2l9 9 9-9a7.2 7.2 0 0 0 0-10.2l-9-9zm25 0l-9 9a7.2 7.2 0 0 0 0 10.2l9 9 9-9a7.2 7.2 0 0 0 0-10.2l-9-9zM50 43.1l-9 9 9 9 9-9-9-9z"/>
    </svg>`
  },
  linkedin: {
    id: 'linkedin',
    name: 'LinkedIn',
    color: '#0A66C2',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>`,
    badgeSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <rect width="96" height="96" x="2" y="2" rx="20" fill="#0A66C2"/>
      <path fill="#ffffff" d="M30.4 40.5H20.6V72h9.8V40.5zM25.5 25C22.4 25 20 27.4 20 30.4c0 3 2.4 5.4 5.5 5.4s5.5-2.4 5.5-5.4c0-3-2.5-5.4-5.5-5.4zM47.2 72h9.8V53.8c0-9.8 12.6-10.6 12.6 0V72h9.8V50.4c0-16.8-18.1-16.2-22.4-7.9v-2h-9.8V72z"/>
    </svg>`
  },
  youtube: {
    id: 'youtube',
    name: 'YouTube',
    color: '#FF0000',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/><polygon points="10 15 15 12 10 9 10 15"/></svg>`,
    badgeSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="48" fill="#FF0000"/>
      <path fill="#ffffff" d="M72 36c-.6-2.5-2.5-4.4-5-5-4.4-1.2-22-1.2-22-1.2s-17.6 0-22 1.2c-2.5.6-4.4 2.5-5 5-1.2 4.4-1.2 14-1.2 14s0 9.6 1.2 14c.6 2.5 2.5 4.4 5 5 4.4 1.2 22 1.2 22 1.2s17.6 0 22-1.2c2.5-.6 4.4-2.5 5-5 1.2-4.4 1.2-14 1.2-14s0-9.6-1.2-14z"/>
      <polygon fill="#FF0000" points="45,41 45,59 60,50"/>
    </svg>`
  },
  wifi: {
    id: 'wifi',
    name: 'Wi-Fi',
    color: '#3B82F6',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>`,
    badgeSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="48" fill="#2563EB"/>
      <path fill="#ffffff" d="M50 68a6 6 0 1 0 0 12 6 6 0 0 0 0-12zm-18.4-14a26 26 0 0 1 36.8 0l-5.6 5.6a18 18 0 0 0-25.6 0l-5.6-5.6zm-11.3-11.3a42 42 0 0 1 59.4 0l-5.6 5.6a34 34 0 0 0-48.2 0l-5.6-5.6zm-11.3-11.3a58 58 0 0 1 82 0l-5.6 5.6a50 50 0 0 0-70.8 0l-5.6-5.6z"/>
    </svg>`
  },
  website: {
    id: 'website',
    name: 'Website / Globo',
    color: '#6366F1',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
    badgeSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="48" fill="#4F46E5"/>
      <circle cx="50" cy="50" r="32" fill="none" stroke="#ffffff" stroke-width="5"/>
      <line x1="18" y1="50" x2="82" y2="50" stroke="#ffffff" stroke-width="5"/>
      <ellipse cx="50" cy="50" rx="16" ry="32" fill="none" stroke="#ffffff" stroke-width="5"/>
    </svg>`
  },
  github: {
    id: 'github',
    name: 'GitHub',
    color: '#24292F',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>`,
    badgeSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="48" fill="#24292F"/>
      <path fill="#ffffff" d="M50 20C33.4 20 20 33.4 20 50c0 13.3 8.6 24.5 20.6 28.5 1.5.3 2-.7 2-1.4v-5.2c-8.3 1.8-10.1-4-10.1-4-1.4-3.5-3.4-4.4-3.4-4.4-2.7-1.9.2-1.8.2-1.8 3 .2 4.6 3.1 4.6 3.1 2.7 4.6 7 3.3 8.7 2.5.3-2 1.1-3.3 2-4-6.7-.8-13.7-3.3-13.7-14.8 0-3.3 1.2-5.9 3.1-8-.3-.8-1.3-3.8.3-7.9 0 0 2.5-.8 8.2 3.1a28.4 28.4 0 0 1 15 0c5.7-3.9 8.2-3.1 8.2-3.1 1.6 4.1.6 7.1.3 7.9 1.9 2.1 3.1 4.7 3.1 8 0 11.5-7 14-13.7 14.8 1.1 1 2.1 2.8 2.1 5.7v8.5c0 .7.5 1.7 2.1 1.4C71.4 74.5 80 63.3 80 50c0-16.6-13.4-30-30-30z"/>
    </svg>`
  },
  x: {
    id: 'x',
    name: 'X (Twitter)',
    color: '#000000',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4l16 16M4 20L20 4"/></svg>`,
    badgeSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="48" fill="#000000"/>
      <path fill="#ffffff" d="M68 28h8.5L58 49.3 79.8 78H62.7L49.3 60.5 34 78h-8.5l19.8-22.6L24 28h17.5l12.2 16.1L68 28zm-3 44.9h4.7L38.7 32.8H33.7L65 72.9z"/>
    </svg>`
  },
  spotify: {
    id: 'spotify',
    name: 'Spotify',
    color: '#1DB954',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 11.5c3.5-1 7.5-.5 10 1"/><path d="M9 15c2.5-.7 5.5-.3 7.5.8"/><path d="M7 8c4.5-1.2 9.5-.7 13 1.5"/></svg>`,
    badgeSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="48" fill="#1DB954"/>
      <path fill="#ffffff" d="M69.8 45.4c-13.2-7.8-35-8.6-47.6-4.7-2 .6-4.2-.5-4.8-2.5-.6-2 .5-4.2 2.5-4.8 14.4-4.4 38.6-3.5 53.8 5.5 1.8 1.1 2.4 3.4 1.3 5.2-1 1.8-3.4 2.4-5.2 1.3zm.2 12c-1.1 1.7-3.3 2.2-5 1.2-11.4-7-28.7-9-42.2-4.9-1.9.6-3.9-.5-4.5-2.4-.6-1.9.5-3.9 2.4-4.5 15.4-4.7 34.6-2.4 47.9 5.8 1.7.9 2.2 3.1 1.4 4.8zm-1.8 11.6c-.9 1.4-2.7 1.8-4.1 1-9.9-6-22.3-7.4-36.9-4.1-1.6.4-3.2-.6-3.6-2.2-.4-1.6.6-3.2 2.2-3.6 16-3.7 29.8-2 41 4.8 1.4.9 1.8 2.7 1.4 4.1z"/>
    </svg>`
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    color: '#000000',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/></svg>`,
    badgeSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="48" fill="#000000"/>
      <path fill="#00f2fe" d="M68 40a18 18 0 0 1-10-3v21a16 16 0 1 1-16-16c.8 0 1.6.1 2.3.2V51a7.7 7.7 0 1 0 5.4 7.4V24h8.3a18 18 0 0 0 10 16z" opacity="0.8"/>
      <path fill="#fe0979" d="M66 38a18 18 0 0 1-10-3v21a16 16 0 1 1-16-16c.8 0 1.6.1 2.3.2V49a7.7 7.7 0 1 0 5.4 7.4V22h8.3a18 18 0 0 0 10 16z" opacity="0.8"/>
      <path fill="#ffffff" d="M67 39a18 18 0 0 1-10-3v21a16 16 0 1 1-16-16c.8 0 1.6.1 2.3.2V50a7.7 7.7 0 1 0 5.4 7.4V23h8.3a18 18 0 0 0 10 16z"/>
    </svg>`
  },
  email: {
    id: 'email',
    name: 'E-mail',
    color: '#EA4335',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
    badgeSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="48" fill="#EA4335"/>
      <rect width="56" height="40" x="22" y="30" rx="6" fill="#ffffff"/>
      <path fill="#EA4335" d="M22 34l28 20 28-20v-4H22z"/>
    </svg>`
  },
  phone: {
    id: 'phone',
    name: 'Telefone',
    color: '#10B981',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
    badgeSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="48" fill="#10B981"/>
      <path fill="#ffffff" d="M68 62.9v7.5c0 2.5-2 4.5-4.5 4.5-22.1 0-40-17.9-40-40 0-2.5 2-4.5 4.5-4.5h7.5c2.2 0 4.1 1.6 4.4 3.8.4 2.8 1.2 5.5 2.3 8.1.7 1.6.3 3.5-.9 4.8L38 50.5c4.7 9.1 12.1 16.5 21.2 21.2l3.4-3.4c1.3-1.3 3.2-1.6 4.8-.9 2.6 1.1 5.3 1.9 8.1 2.3 2.2.4 3.8 2.2 3.8 4.4z"/>
    </svg>`
  },
  cart: {
    id: 'cart',
    name: 'Loja / Carrinho',
    color: '#8B5CF6',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>`,
    badgeSvg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="48" fill="#8B5CF6"/>
      <path fill="#ffffff" d="M74 38H33.2l-2-8H20v6h7.4l8.6 34.4c.8 3.2 3.6 5.6 6.9 5.6h25.1v-6H42.9c-.8 0-1.5-.6-1.7-1.4l-1.4-5.6h29.8c3.2 0 5.9-2.2 6.6-5.4L81 44c.4-1.8-.1-3.6-1.3-4.8s-3-1.2-5.7-1.2zm-28 38a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm22 0a5 5 0 1 1 0 10 5 5 0 0 1 0-10z"/>
    </svg>`
  }
};

/**
 * Converte um SVG string em uma Data URL utilizável pelo qr-code-styling
 */
window.getIconDataUrl = function(iconId) {
  const icon = window.QR_ICONS[iconId];
  if (!icon || !icon.badgeSvg) return null;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(icon.badgeSvg);
};
