import { LanguageCode } from '../types/domain';

export interface ThemePreset {
  id: string;
  category: 'light' | 'dark';
  name: Record<LanguageCode, string>;
  description: Record<LanguageCode, string>;
  tokens: {
    bgCanvas: string;
    bgSurface: string;
    bgSurfaceRaised: string;
    bgSubtle: string;
    bgSidebar: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    borderSubtle: string;
    borderStrong: string;
    accentPrimary: string;
    accentPrimaryHover: string;
    accentSubtle: string;
    accentText: string;
  };
}

export const LIGHT_THEMES: ThemePreset[] = [
  {
    id: 'light-notarial-slate',
    category: 'light',
    name: {
      'pt-BR': '01. Ardósia Notarial (Padrão Claro)',
      en: '01. Notarial Slate (Default Light)',
      es: '01. Pizarra Notarial (Claro Predeterminado)',
    },
    description: {
      'pt-BR': 'Superfície mineral neutra com azul institucional de alta legibilidade.',
      en: 'Neutral mineral surface with high-legibility institutional blue.',
      es: 'Superficie mineral neutra con azul institucional de alta legibilidad.',
    },
    tokens: {
      bgCanvas: '#f8fafc',
      bgSurface: '#ffffff',
      bgSurfaceRaised: '#f1f5f9',
      bgSubtle: '#f1f5f9',
      bgSidebar: '#0f172a',
      textPrimary: '#0f172a',
      textSecondary: '#334155',
      textMuted: '#64748b',
      borderSubtle: '#e2e8f0',
      borderStrong: '#cbd5e1',
      accentPrimary: '#1d4ed8',
      accentPrimaryHover: '#1e40af',
      accentSubtle: '#eff6ff',
      accentText: '#1e3a8a',
    },
  },
  {
    id: 'light-ivory-ledger',
    category: 'light',
    name: {
      'pt-BR': '02. Livro-Razão Marfim',
      en: '02. Ivory Ledger',
      es: '02. Libro Mayor Marfil',
    },
    description: {
      'pt-BR': 'Papel contábil aquecido para leitura prolongada de contratos e auditorias.',
      en: 'Warm accounting paper tuned for extended contract and audit reading.',
      es: 'Papel contable cálido para lectura prolongada de contratos y auditorías.',
    },
    tokens: {
      bgCanvas: '#faf8f5',
      bgSurface: '#fffdfa',
      bgSurfaceRaised: '#f3efe6',
      bgSubtle: '#f3efe6',
      bgSidebar: '#1c1917',
      textPrimary: '#1c1917',
      textSecondary: '#44403c',
      textMuted: '#78716c',
      borderSubtle: '#e7e2d8',
      borderStrong: '#d6cfc2',
      accentPrimary: '#1e3a8a',
      accentPrimaryHover: '#172554',
      accentSubtle: '#eef2ff',
      accentText: '#1e3a8a',
    },
  },
  {
    id: 'light-swiss-grid',
    category: 'light',
    name: {
      'pt-BR': '03. Grade Suíça Pura',
      en: '03. Pure Swiss Grid',
      es: '03. Cuadrícula Suiza Pura',
    },
    description: {
      'pt-BR': 'Contraste editorial máximo sobre branco puro e divisórias de precisão.',
      en: 'Maximum editorial contrast on crisp white with precision hairlines.',
      es: 'Contraste editorial máximo sobre blanco puro y líneas de precisión.',
    },
    tokens: {
      bgCanvas: '#ffffff',
      bgSurface: '#ffffff',
      bgSurfaceRaised: '#f4f4f5',
      bgSubtle: '#f4f4f5',
      bgSidebar: '#09090b',
      textPrimary: '#09090b',
      textSecondary: '#27272a',
      textMuted: '#52525b',
      borderSubtle: '#e4e4e7',
      borderStrong: '#d4d4d8',
      accentPrimary: '#2563eb',
      accentPrimaryHover: '#1d4ed8',
      accentSubtle: '#eff6ff',
      accentText: '#1d4ed8',
    },
  },
  {
    id: 'light-nordic-frost',
    category: 'light',
    name: {
      'pt-BR': '04. Bruma Nórdica',
      en: '04. Nordic Frost',
      es: '04. Escarcha Nórdica',
    },
    description: {
      'pt-BR': 'Tons frios escandinavos com azul cerúleo para operações logísticas.',
      en: 'Cool Scandinavian tones with cerulean blue for logistics operations.',
      es: 'Tonos fríos escandinavos con azul cerúleo para operaciones logísticas.',
    },
    tokens: {
      bgCanvas: '#f0f6fa',
      bgSurface: '#ffffff',
      bgSurfaceRaised: '#e3eef6',
      bgSubtle: '#e3eef6',
      bgSidebar: '#0c1926',
      textPrimary: '#0f1e2e',
      textSecondary: '#2b4257',
      textMuted: '#5a738a',
      borderSubtle: '#d5e4ef',
      borderStrong: '#b8cfe0',
      accentPrimary: '#0284c7',
      accentPrimaryHover: '#0369a1',
      accentSubtle: '#e0f2fe',
      accentText: '#075985',
    },
  },
  {
    id: 'light-emerald-treasury',
    category: 'light',
    name: {
      'pt-BR': '05. Tesouraria Esmeralda',
      en: '05. Emerald Treasury',
      es: '05. Tesorería Esmeralda',
    },
    description: {
      'pt-BR': 'Inspirado em sistemas bancários e conciliação financeira corporativa.',
      en: 'Inspired by private banking and corporate financial reconciliation.',
      es: 'Inspirado en sistemas bancarios y conciliación financiera corporativa.',
    },
    tokens: {
      bgCanvas: '#f3f8f5',
      bgSurface: '#ffffff',
      bgSurfaceRaised: '#e6f1eb',
      bgSubtle: '#e6f1eb',
      bgSidebar: '#062419',
      textPrimary: '#09261b',
      textSecondary: '#234739',
      textMuted: '#537567',
      borderSubtle: '#d3e5db',
      borderStrong: '#b5d1c2',
      accentPrimary: '#047857',
      accentPrimaryHover: '#065f46',
      accentSubtle: '#ecfdf5',
      accentText: '#065f46',
    },
  },
  {
    id: 'light-teal-harbor',
    category: 'light',
    name: {
      'pt-BR': '06. Porto Atlântico (Teal)',
      en: '06. Atlantic Harbor (Teal)',
      es: '06. Puerto Atlántico (Teal)',
    },
    description: {
      'pt-BR': 'Equilíbrio oceânico entre verde-azulado profundo e cinza mineral.',
      en: 'Oceanic balance between deep executive teal and mineral grey.',
      es: 'Equilibrio oceánico entre verde azulado profundo y gris mineral.',
    },
    tokens: {
      bgCanvas: '#f2f7f7',
      bgSurface: '#ffffff',
      bgSurfaceRaised: '#e4efef',
      bgSubtle: '#e4efef',
      bgSidebar: '#082224',
      textPrimary: '#0d2628',
      textSecondary: '#28494c',
      textMuted: '#56787b',
      borderSubtle: '#d2e4e4',
      borderStrong: '#b4cfcf',
      accentPrimary: '#0f766e',
      accentPrimaryHover: '#115e59',
      accentSubtle: '#f0fdfa',
      accentText: '#134e4a',
    },
  },
  {
    id: 'light-amber-commerce',
    category: 'light',
    name: {
      'pt-BR': '07. Âmbar Mercantil',
      en: '07. Mercantile Amber',
      es: '07. Ámbar Mercantil',
    },
    description: {
      'pt-BR': 'Superfície clara com destaque ocre executivo para varejo e pedidos.',
      en: 'Warm surface with executive ochre accents for retail and orders.',
      es: 'Superficie cálida con acento ocre ejecutivo para comercio y pedidos.',
    },
    tokens: {
      bgCanvas: '#fcf9f5',
      bgSurface: '#ffffff',
      bgSurfaceRaised: '#f5efe6',
      bgSubtle: '#f5efe6',
      bgSidebar: '#26190c',
      textPrimary: '#24180b',
      textSecondary: '#4d3924',
      textMuted: '#7d664e',
      borderSubtle: '#ebe0d1',
      borderStrong: '#d9c8b2',
      accentPrimary: '#b45309',
      accentPrimaryHover: '#92400e',
      accentSubtle: '#fffbeb',
      accentText: '#78350f',
    },
  },
  {
    id: 'light-terracotta-atelier',
    category: 'light',
    name: {
      'pt-BR': '08. Atelier Terracota',
      en: '08. Terracotta Atelier',
      es: '08. Atelier Terracota',
    },
    description: {
      'pt-BR': 'Identidade manufatureira artesanal com tons de argila e linho cru.',
      en: 'Artisanal manufacturing identity with clay and raw linen tones.',
      es: 'Identidad manufacturera artesanal con tonos arcilla y lino crudo.',
    },
    tokens: {
      bgCanvas: '#fbf6f3',
      bgSurface: '#ffffff',
      bgSurfaceRaised: '#f4ebe6',
      bgSubtle: '#f4ebe6',
      bgSidebar: '#29140e',
      textPrimary: '#26140e',
      textSecondary: '#523229',
      textMuted: '#825f55',
      borderSubtle: '#eadad3',
      borderStrong: '#d6beb4',
      accentPrimary: '#c2410c',
      accentPrimaryHover: '#9a3412',
      accentSubtle: '#fff7ed',
      accentText: '#7c2d12',
    },
  },
  {
    id: 'light-burgundy-chancery',
    category: 'light',
    name: {
      'pt-BR': '09. Chancelaria Bordô',
      en: '09. Burgundy Chancery',
      es: '09. Cancillería Burdeos',
    },
    description: {
      'pt-BR': 'Sobriedade jurídica e cartorial com acento carmim profundo.',
      en: 'Legal and notarial sobriety with deep crimson-burgundy accents.',
      es: 'Sobriedad jurídica y notarial con acento carmesí profundo.',
    },
    tokens: {
      bgCanvas: '#faf5f6',
      bgSurface: '#ffffff',
      bgSurfaceRaised: '#f3eaec',
      bgSubtle: '#f3eaec',
      bgSidebar: '#260d14',
      textPrimary: '#240f15',
      textSecondary: '#4f2a34',
      textMuted: '#7f5863',
      borderSubtle: '#e8d8dc',
      borderStrong: '#d4bcc2',
      accentPrimary: '#9f1239',
      accentPrimaryHover: '#881337',
      accentSubtle: '#fff1f2',
      accentText: '#881337',
    },
  },
  {
    id: 'light-indigo-parliament',
    category: 'light',
    name: {
      'pt-BR': '10. Parlamento Índigo',
      en: '10. Parliament Indigo',
      es: '10. Parlamento Índigo',
    },
    description: {
      'pt-BR': 'Governança corporativa e HBAC com azul-índigo de alto contraste.',
      en: 'Corporate governance and HBAC with high-contrast indigo.',
      es: 'Gobernanza corporativa y HBAC con azul índigo de alto contraste.',
    },
    tokens: {
      bgCanvas: '#f5f6fb',
      bgSurface: '#ffffff',
      bgSurfaceRaised: '#ebedf7',
      bgSubtle: '#ebedf7',
      bgSidebar: '#131633',
      textPrimary: '#141730',
      textSecondary: '#34395e',
      textMuted: '#63688f',
      borderSubtle: '#dce0f0',
      borderStrong: '#c2c8e3',
      accentPrimary: '#4338ca',
      accentPrimaryHover: '#3730a3',
      accentSubtle: '#eef2ff',
      accentText: '#312e81',
    },
  },
  {
    id: 'light-violet-actuary',
    category: 'light',
    name: {
      'pt-BR': '11. Atuarial Violeta',
      en: '11. Actuary Violet',
      es: '11. Actuarial Violeta',
    },
    description: {
      'pt-BR': 'Precisão analítica para relatórios, métricas e inteligência de dados.',
      en: 'Analytical precision for reports, metrics, and data intelligence.',
      es: 'Precisión analítica para informes, métricas e inteligencia de datos.',
    },
    tokens: {
      bgCanvas: '#f8f6fc',
      bgSurface: '#ffffff',
      bgSurfaceRaised: '#efeaf8',
      bgSubtle: '#efeaf8',
      bgSidebar: '#1d1233',
      textPrimary: '#1e1433',
      textSecondary: '#433263',
      textMuted: '#715f94',
      borderSubtle: '#e2daf0',
      borderStrong: '#ccc0e3',
      accentPrimary: '#6d28d9',
      accentPrimaryHover: '#5b21b6',
      accentSubtle: '#f5f3ff',
      accentText: '#4c1d95',
    },
  },
  {
    id: 'light-graphite-mono',
    category: 'light',
    name: {
      'pt-BR': '12. Grafite Monocromático',
      en: '12. Monochromatic Graphite',
      es: '12. Grafito Monocromático',
    },
    description: {
      'pt-BR': 'Estética arquitetônica neutra em tons de carvão, zinco e aço.',
      en: 'Neutral architectural aesthetic in charcoal, zinc, and steel tones.',
      es: 'Estética arquitectónica neutra en tonos carbón, zinc y acero.',
    },
    tokens: {
      bgCanvas: '#f4f4f5',
      bgSurface: '#ffffff',
      bgSurfaceRaised: '#e4e4e7',
      bgSubtle: '#e4e4e7',
      bgSidebar: '#18181b',
      textPrimary: '#18181b',
      textSecondary: '#3f3f46',
      textMuted: '#71717a',
      borderSubtle: '#e4e4e7',
      borderStrong: '#d4d4d8',
      accentPrimary: '#27272a',
      accentPrimaryHover: '#09090b',
      accentSubtle: '#f4f4f5',
      accentText: '#18181b',
    },
  },
  {
    id: 'light-olive-agribusiness',
    category: 'light',
    name: {
      'pt-BR': '13. Oliva Botânico',
      en: '13. Botanical Olive',
      es: '13. Oliva Botánico',
    },
    description: {
      'pt-BR': 'Paleta orgânica e serena para cooperativas, bioindústria e suprimentos.',
      en: 'Organic, serene palette for cooperatives, bio-industry, and supply.',
      es: 'Paleta orgánica y serena para cooperativas, bioindustria y suministros.',
    },
    tokens: {
      bgCanvas: '#f6f7f2',
      bgSurface: '#ffffff',
      bgSurfaceRaised: '#ebeee3',
      bgSubtle: '#ebeee3',
      bgSidebar: '#192110',
      textPrimary: '#1b2412',
      textSecondary: '#3c4a2d',
      textMuted: '#687856',
      borderSubtle: '#dce2d0',
      borderStrong: '#c4cfaf',
      accentPrimary: '#3f6212',
      accentPrimaryHover: '#365314',
      accentSubtle: '#f7fee7',
      accentText: '#365314',
    },
  },
  {
    id: 'light-cobalt-aviation',
    category: 'light',
    name: {
      'pt-BR': '14. Cobalto Aeroespacial',
      en: '14. Aerospace Cobalt',
      es: '14. Cobalto Aeroespacial',
    },
    description: {
      'pt-BR': 'Telemetria clara inspirada em manuais de aviação e API Hub técnico.',
      en: 'Crisp telemetry inspired by aviation manuals and technical API hubs.',
      es: 'Telemetría clara inspirada en manuales de aviación y API Hub técnico.',
    },
    tokens: {
      bgCanvas: '#eef3f9',
      bgSurface: '#ffffff',
      bgSurfaceRaised: '#e1ebf5',
      bgSubtle: '#e1ebf5',
      bgSidebar: '#0a192f',
      textPrimary: '#0a192f',
      textSecondary: '#233554',
      textMuted: '#536b8a',
      borderSubtle: '#d0dff0',
      borderStrong: '#b2cae6',
      accentPrimary: '#1e40af',
      accentPrimaryHover: '#1e3a8a',
      accentSubtle: '#dbeafe',
      accentText: '#1e3a8a',
    },
  },
  {
    id: 'light-sandstone-bank',
    category: 'light',
    name: {
      'pt-BR': '15. Arenito Patrimonial',
      en: '15. Heritage Sandstone',
      es: '15. Arenisca Patrimonial',
    },
    description: {
      'pt-BR': 'Pedra natural e bronze escuro com estética de instituição sólida.',
      en: 'Natural stone and dark bronze with a solid institutional aesthetic.',
      es: 'Piedra natural y bronce oscuro con estética institucional sólida.',
    },
    tokens: {
      bgCanvas: '#f6f4ef',
      bgSurface: '#ffffff',
      bgSurfaceRaised: '#ece8df',
      bgSubtle: '#ece8df',
      bgSidebar: '#1f1b16',
      textPrimary: '#211d17',
      textSecondary: '#4a4236',
      textMuted: '#7a6f5d',
      borderSubtle: '#e0d9cb',
      borderStrong: '#ccc2ae',
      accentPrimary: '#78350f',
      accentPrimaryHover: '#5c280b',
      accentSubtle: '#fef3c7',
      accentText: '#78350f',
    },
  },
];

export const DARK_THEMES: ThemePreset[] = [
  {
    id: 'dark-obsidian-dispatch',
    category: 'dark',
    name: {
      'pt-BR': '01. Despacho Obsidiana (Padrão Escuro)',
      en: '01. Obsidian Dispatch (Default Dark)',
      es: '01. Despacho Obsidiana (Oscuro Predeterminado)',
    },
    description: {
      'pt-BR': 'Ardósia noturna profunda com azul técnico calibrado para zero fadiga.',
      en: 'Deep nocturnal slate with calibrated technical blue for zero eye strain.',
      es: 'Pizarra nocturna profunda con azul técnico calibrado sin fatiga visual.',
    },
    tokens: {
      bgCanvas: '#0b0f17',
      bgSurface: '#111827',
      bgSurfaceRaised: '#1e293b',
      bgSubtle: '#161f30',
      bgSidebar: '#070a10',
      textPrimary: '#f8fafc',
      textSecondary: '#cbd5e1',
      textMuted: '#94a3b8',
      borderSubtle: '#1e293b',
      borderStrong: '#334155',
      accentPrimary: '#3b82f6',
      accentPrimaryHover: '#60a5fa',
      accentSubtle: '#172554',
      accentText: '#93c5fd',
    },
  },
  {
    id: 'dark-midnight-ledger',
    category: 'dark',
    name: {
      'pt-BR': '02. Razão Meia-Noite',
      en: '02. Midnight Ledger',
      es: '02. Libro Mayor Medianoche',
    },
    description: {
      'pt-BR': 'Azul marinho abissal com indicadores ciano de alta nitidez.',
      en: 'Abyssal navy blue with razor-sharp cyan financial indicators.',
      es: 'Azul marino abisal con indicadores cian de alta nitidez.',
    },
    tokens: {
      bgCanvas: '#07101c',
      bgSurface: '#0d192b',
      bgSurfaceRaised: '#152640',
      bgSubtle: '#112036',
      bgSidebar: '#040911',
      textPrimary: '#f0f9ff',
      textSecondary: '#bae6fd',
      textMuted: '#7dd3fc',
      borderSubtle: '#172b47',
      borderStrong: '#244169',
      accentPrimary: '#0ea5e9',
      accentPrimaryHover: '#38bdf8',
      accentSubtle: '#082f49',
      accentText: '#7dd3fc',
    },
  },
  {
    id: 'dark-carbon-terminal',
    category: 'dark',
    name: {
      'pt-BR': '03. Terminal Carbono',
      en: '03. Carbon Terminal',
      es: '03. Terminal Carbono',
    },
    description: {
      'pt-BR': 'Grafite neutro de engenharia para inspeção de APIs e logs de auditoria.',
      en: 'Neutral engineering graphite for API inspection and audit logs.',
      es: 'Grafito neutro de ingeniería para inspección de APIs y auditoría.',
    },
    tokens: {
      bgCanvas: '#0a0a0c',
      bgSurface: '#121316',
      bgSurfaceRaised: '#1c1e24',
      bgSubtle: '#17181d',
      bgSidebar: '#050507',
      textPrimary: '#f4f4f5',
      textSecondary: '#d4d4d8',
      textMuted: '#a1a1aa',
      borderSubtle: '#27272a',
      borderStrong: '#3f3f46',
      accentPrimary: '#3b82f6',
      accentPrimaryHover: '#60a5fa',
      accentSubtle: '#172554',
      accentText: '#93c5fd',
    },
  },
  {
    id: 'dark-emerald-vault',
    category: 'dark',
    name: {
      'pt-BR': '04. Cofre Esmeralda',
      en: '04. Emerald Vault',
      es: '04. Bóveda Esmeralda',
    },
    description: {
      'pt-BR': 'Ambiente noturno de tesouraria com verde-esmeralda institucional.',
      en: 'Nocturnal treasury workspace with institutional emerald green.',
      es: 'Ambiente nocturno de tesorería con verde esmeralda institucional.',
    },
    tokens: {
      bgCanvas: '#06120e',
      bgSurface: '#0b1d17',
      bgSurfaceRaised: '#132e25',
      bgSubtle: '#0f251d',
      bgSidebar: '#030a08',
      textPrimary: '#ecfdf5',
      textSecondary: '#a7f3d0',
      textMuted: '#6ee7b7',
      borderSubtle: '#16382c',
      borderStrong: '#225442',
      accentPrimary: '#10b981',
      accentPrimaryHover: '#34d399',
      accentSubtle: '#064e3b',
      accentText: '#6ee7b7',
    },
  },
  {
    id: 'dark-teal-maritime',
    category: 'dark',
    name: {
      'pt-BR': '05. Marítimo Turquesa',
      en: '05. Maritime Teal',
      es: '05. Marítimo Turquesa',
    },
    description: {
      'pt-BR': 'Profundidade oceânica para controle de estoques e frotas.',
      en: 'Oceanic depth tailored for inventory and multi-branch operations.',
      es: 'Profundidad oceánica para control de inventarios y sucursales.',
    },
    tokens: {
      bgCanvas: '#061315',
      bgSurface: '#0b1f22',
      bgSurfaceRaised: '#133136',
      bgSubtle: '#0e272b',
      bgSidebar: '#040b0c',
      textPrimary: '#f0fdfa',
      textSecondary: '#99f6e4',
      textMuted: '#5eead4',
      borderSubtle: '#173b40',
      borderStrong: '#23565e',
      accentPrimary: '#14b8a6',
      accentPrimaryHover: '#2dd4bf',
      accentSubtle: '#134e4a',
      accentText: '#5eead4',
    },
  },
  {
    id: 'dark-indigo-command',
    category: 'dark',
    name: {
      'pt-BR': '06. Comando Índigo',
      en: '06. Indigo Command',
      es: '06. Comando Índigo',
    },
    description: {
      'pt-BR': 'Centro de comando multiempresa com contraste índigo acetinado.',
      en: 'Multi-tenant command center with satin indigo contrast.',
      es: 'Centro de comando multiempresa con contraste índigo satinado.',
    },
    tokens: {
      bgCanvas: '#0b0d1c',
      bgSurface: '#12152b',
      bgSurfaceRaised: '#1d2242',
      bgSubtle: '#171b36',
      bgSidebar: '#060812',
      textPrimary: '#eef2ff',
      textSecondary: '#c7d2fe',
      textMuted: '#a5b4fc',
      borderSubtle: '#23294f',
      borderStrong: '#343d73',
      accentPrimary: '#6366f1',
      accentPrimaryHover: '#818cf8',
      accentSubtle: '#1e1b4b',
      accentText: '#a5b4fc',
    },
  },
  {
    id: 'dark-amethyst-cipher',
    category: 'dark',
    name: {
      'pt-BR': '07. Cifra Ametista',
      en: '07. Amethyst Cipher',
      es: '07. Cifra Amatista',
    },
    description: {
      'pt-BR': 'Superfície ônix-violeta focada em criptografia, tokens e segurança.',
      en: 'Onyx-violet surface focused on cryptography, tokens, and security.',
      es: 'Superficie ónix-violeta enfocada en criptografía, tokens y seguridad.',
    },
    tokens: {
      bgCanvas: '#100b1a',
      bgSurface: '#181127',
      bgSurfaceRaised: '#251b3d',
      bgSubtle: '#1e1532',
      bgSidebar: '#090610',
      textPrimary: '#f5f3ff',
      textSecondary: '#ddd6fe',
      textMuted: '#c4b5fd',
      borderSubtle: '#2c2047',
      borderStrong: '#43316b',
      accentPrimary: '#8b5cf6',
      accentPrimaryHover: '#a78bfa',
      accentSubtle: '#2e1065',
      accentText: '#c4b5fd',
    },
  },
  {
    id: 'dark-crimson-audit',
    category: 'dark',
    name: {
      'pt-BR': '08. Auditoria Carmim',
      en: '08. Crimson Audit',
      es: '08. Auditoría Carmesí',
    },
    description: {
      'pt-BR': 'Ébano forense com marcadores rubi para governança e conformidade.',
      en: 'Forensic ebony with ruby markers for governance and compliance.',
      es: 'Ébano forense con marcadores rubí para gobernanza y cumplimiento.',
    },
    tokens: {
      bgCanvas: '#140a0d',
      bgSurface: '#1f1015',
      bgSurfaceRaised: '#301920',
      bgSubtle: '#26141a',
      bgSidebar: '#0c0507',
      textPrimary: '#fff1f2',
      textSecondary: '#fecdd3',
      textMuted: '#fda4af',
      borderSubtle: '#3b1e27',
      borderStrong: '#592d3b',
      accentPrimary: '#e11d48',
      accentPrimaryHover: '#f43f5e',
      accentSubtle: '#4c0519',
      accentText: '#fda4af',
    },
  },
  {
    id: 'dark-amber-foundry',
    category: 'dark',
    name: {
      'pt-BR': '09. Forja Âmbar',
      en: '09. Amber Foundry',
      es: '09. Forja Ámbar',
    },
    description: {
      'pt-BR': 'Contraste quente em ouro velho e basalto para leitura noturna confortável.',
      en: 'Warm antique gold on basalt for comfortable late-night operations.',
      es: 'Contraste cálido en oro viejo y basalto para lectura nocturna.',
    },
    tokens: {
      bgCanvas: '#130f08',
      bgSurface: '#1c160d',
      bgSurfaceRaised: '#2b2214',
      bgSubtle: '#231c10',
      bgSidebar: '#0a0804',
      textPrimary: '#fffbeb',
      textSecondary: '#fde68a',
      textMuted: '#fcd34d',
      borderSubtle: '#362b19',
      borderStrong: '#524126',
      accentPrimary: '#d97706',
      accentPrimaryHover: '#f59e0b',
      accentSubtle: '#451a03',
      accentText: '#fcd34d',
    },
  },
  {
    id: 'dark-copper-industrial',
    category: 'dark',
    name: {
      'pt-BR': '10. Cobre Industrial',
      en: '10. Industrial Copper',
      es: '10. Cobre Industrial',
    },
    description: {
      'pt-BR': 'Tons metalúrgicos de cobre e ferro fundido para manufatura e estoque.',
      en: 'Metallurgical copper and cast-iron tones for manufacturing and stock.',
      es: 'Tonos metalúrgicos de cobre y hierro fundido para manufactura.',
    },
    tokens: {
      bgCanvas: '#140e0b',
      bgSurface: '#1f1612',
      bgSurfaceRaised: '#30221c',
      bgSubtle: '#261b16',
      bgSidebar: '#0b0706',
      textPrimary: '#fff7ed',
      textSecondary: '#fed7aa',
      textMuted: '#fdba74',
      borderSubtle: '#3b2a22',
      borderStrong: '#594034',
      accentPrimary: '#ea580c',
      accentPrimaryHover: '#f97316',
      accentSubtle: '#431407',
      accentText: '#fdba74',
    },
  },
  {
    id: 'dark-nordic-night',
    category: 'dark',
    name: {
      'pt-BR': '11. Noite Polar',
      en: '11. Polar Night',
      es: '11. Noche Polar',
    },
    description: {
      'pt-BR': 'Paleta escandinava serena com azul glacial suave.',
      en: 'Serene Scandinavian dark palette with soft glacial blue.',
      es: 'Paleta escandinava serena con azul glacial suave.',
    },
    tokens: {
      bgCanvas: '#0d131a',
      bgSurface: '#141d26',
      bgSurfaceRaised: '#1f2c3a',
      bgSubtle: '#192430',
      bgSidebar: '#080c10',
      textPrimary: '#eceff4',
      textSecondary: '#d8dee9',
      textMuted: '#9aa7b8',
      borderSubtle: '#263647',
      borderStrong: '#384f66',
      accentPrimary: '#38bdf8',
      accentPrimaryHover: '#7dd3fc',
      accentSubtle: '#0c4a6e',
      accentText: '#7dd3fc',
    },
  },
  {
    id: 'dark-olive-tactical',
    category: 'dark',
    name: 'pt-BR' in ({} as Record<LanguageCode, string>) ? { 'pt-BR': '12. Oliva Tático', en: '12. Tactical Olive', es: '12. Oliva Táctico' } : { 'pt-BR': '12. Oliva Tático', en: '12. Tactical Olive', es: '12. Oliva Táctico' },
    description: {
      'pt-BR': 'Campo noturno de alta precisão para operações rurais e suprimentos.',
      en: 'High-precision night field palette for supply chain and logistics.',
      es: 'Campo nocturno de alta precisión para cadena de suministro.',
    },
    tokens: {
      bgCanvas: '#0c120a',
      bgSurface: '#131c10',
      bgSurfaceRaised: '#1e2b19',
      bgSubtle: '#182314',
      bgSidebar: '#070a05',
      textPrimary: '#f7fee7',
      textSecondary: '#d9f99d',
      textMuted: '#bef264',
      borderSubtle: '#263820',
      borderStrong: '#3a5430',
      accentPrimary: '#65a30d',
      accentPrimaryHover: '#84cc16',
      accentSubtle: '#1a2e05',
      accentText: '#bef264',
    },
  },
  {
    id: 'dark-slate-monolith',
    category: 'dark',
    name: {
      'pt-BR': '13. Monólito Acromático',
      en: '13. Achromatic Monolith',
      es: '13. Monolito Acromático',
    },
    description: {
      'pt-BR': 'Puro contraste tipográfico preto/prata sem interferência cromática.',
      en: 'Pure black-and-silver typographic contrast without chromatic noise.',
      es: 'Puro contraste tipográfico negro/plata sin interferencia cromática.',
    },
    tokens: {
      bgCanvas: '#09090b',
      bgSurface: '#121215',
      bgSurfaceRaised: '#1e1e22',
      bgSubtle: '#18181b',
      bgSidebar: '#040405',
      textPrimary: '#fafafa',
      textSecondary: '#d4d4d8',
      textMuted: '#a1a1aa',
      borderSubtle: '#27272a',
      borderStrong: '#3f3f46',
      accentPrimary: '#a1a1aa',
      accentPrimaryHover: '#e4e4e7',
      accentSubtle: '#27272a',
      accentText: '#f4f4f5',
    },
  },
  {
    id: 'dark-sapphire-core',
    category: 'dark',
    name: {
      'pt-BR': '14. Núcleo Safira',
      en: '14. Sapphire Core',
      es: '14. Núcleo Zafiro',
    },
    description: {
      'pt-BR': 'Azul real profundo para apresentações executivas e conselhos.',
      en: 'Deep royal sapphire tuned for executive briefings and boardrooms.',
      es: 'Zafiro real profundo para presentaciones ejecutivas y directorios.',
    },
    tokens: {
      bgCanvas: '#070e22',
      bgSurface: '#0d1736',
      bgSurfaceRaised: '#162554',
      bgSubtle: '#111d42',
      bgSidebar: '#040814',
      textPrimary: '#eff6ff',
      textSecondary: '#bfdbfe',
      textMuted: '#93c5fd',
      borderSubtle: '#1e326e',
      borderStrong: '#2c4899',
      accentPrimary: '#3b82f6',
      accentPrimaryHover: '#60a5fa',
      accentSubtle: '#172554',
      accentText: '#93c5fd',
    },
  },
  {
    id: 'dark-espresso-reserve',
    category: 'dark',
    name: {
      'pt-BR': '15. Reserva Espresso',
      en: '15. Espresso Reserve',
      es: '15. Reserva Espresso',
    },
    description: {
      'pt-BR': 'Torra escura artesanal com acento caramelo para leitura aconchegante.',
      en: 'Artisanal dark roast with caramel accents for warm night reading.',
      es: 'Tueste oscuro artesanal con acento caramelo para lectura nocturna.',
    },
    tokens: {
      bgCanvas: '#120f0d',
      bgSurface: '#1c1714',
      bgSurfaceRaised: '#2b231f',
      bgSubtle: '#231d19',
      bgSidebar: '#0a0807',
      textPrimary: '#faf8f5',
      textSecondary: '#e7e2d8',
      textMuted: '#b8aea0',
      borderSubtle: '#362c27',
      borderStrong: '#52433b',
      accentPrimary: '#d97706',
      accentPrimaryHover: '#f59e0b',
      accentSubtle: '#3d220a',
      accentText: '#fcd34d',
    },
  },
];

export const ALL_THEME_PRESETS: ThemePreset[] = [...LIGHT_THEMES, ...DARK_THEMES];

export function findThemePreset(themeId: string): ThemePreset | undefined {
  if (themeId === 'light') return LIGHT_THEMES[0];
  if (themeId === 'dark') return DARK_THEMES[0];
  return ALL_THEME_PRESETS.find((t) => t.id === themeId);
}

const TOKEN_CSS_VAR_MAP: Record<keyof ThemePreset['tokens'], string> = {
  bgCanvas: '--bg-canvas',
  bgSurface: '--bg-surface',
  bgSurfaceRaised: '--bg-elevated',
  bgSubtle: '--bg-subtle',
  bgSidebar: '--bg-sidebar',
  textPrimary: '--text-primary',
  textSecondary: '--text-secondary',
  textMuted: '--text-muted',
  borderSubtle: '--border-subtle',
  borderStrong: '--border-strong',
  accentPrimary: '--accent-primary',
  accentPrimaryHover: '--accent-primary-hover',
  accentSubtle: '--accent-primary-soft',
  accentText: '--border-focus',
};

export function applyThemePresetToDom(themeId: string): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const meta = document.querySelector('meta[name="color-scheme"]');

  if (themeId === 'system') {
    if (meta) meta.setAttribute('content', 'light dark');
    root.removeAttribute('data-theme');
    for (const cssVar of Object.values(TOKEN_CSS_VAR_MAP)) {
      root.style.removeProperty(cssVar);
    }
    try {
      localStorage.setItem('color-scheme', 'light dark');
      localStorage.removeItem('olivelas-theme-preset');
    } catch {
      // ignore storage errors
    }
    return;
  }

  const preset = findThemePreset(themeId) || LIGHT_THEMES[0];
  const schemeValue = preset.category === 'dark' ? 'dark' : 'light';

  if (meta) {
    meta.setAttribute('content', schemeValue);
  }
  root.setAttribute('data-theme', preset.id);

  for (const [tokenKey, cssVar] of Object.entries(TOKEN_CSS_VAR_MAP)) {
    const val = preset.tokens[tokenKey as keyof ThemePreset['tokens']];
    if (val) {
      root.style.setProperty(cssVar, val);
    }
  }

  try {
    localStorage.setItem('color-scheme', schemeValue);
    localStorage.setItem('olivelas-theme-preset', preset.id);
  } catch {
    // ignore storage errors
  }
}
