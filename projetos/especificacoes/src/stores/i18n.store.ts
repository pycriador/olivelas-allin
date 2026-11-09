import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Locale = "pt-BR" | "en" | "es";

const dict: Record<Locale, Record<string, string>> = {
  "pt-BR": {
    "nav.dashboard": "Painel",
    "nav.workspace": "Workspace",
    "nav.projects": "Projetos",
    "nav.explorer": "Explorer",
    "nav.favorites": "Favoritos",
    "nav.templates": "Templates",
    "nav.library": "Biblioteca",
    "nav.trash": "Lixeira",
    "nav.settings": "Configurações",
    "nav.admin": "Administrador",
    "search.placeholder": "Buscar specs, projetos, tags…",
    "dashboard.title": "Painel",
    "dashboard.subtitle": "Visão geral da sua plataforma",
    "cards.projects": "Projetos",
    "cards.specs": "Especificações",
    "cards.sprints": "Sprints",
    "cards.users": "Usuários",
    "cards.templates": "Templates",
    "cards.lastSync": "Última sincronização",
    "empty.title": "Nada por aqui ainda",
    "empty.subtitle": "Comece criando um novo item.",
    "settings.language": "Idioma",
    "settings.theme": "Tema",
    "settings.mode": "Modo",
  },
  en: {
    "nav.dashboard": "Dashboard",
    "nav.workspace": "Workspace",
    "nav.projects": "Projects",
    "nav.explorer": "Explorer",
    "nav.favorites": "Favorites",
    "nav.templates": "Templates",
    "nav.library": "Library",
    "nav.trash": "Trash",
    "nav.settings": "Settings",
    "nav.admin": "Admin",
    "search.placeholder": "Search specs, projects, tags…",
    "dashboard.title": "Dashboard",
    "dashboard.subtitle": "Platform overview",
    "cards.projects": "Projects",
    "cards.specs": "Specifications",
    "cards.sprints": "Sprints",
    "cards.users": "Users",
    "cards.templates": "Templates",
    "cards.lastSync": "Last sync",
    "empty.title": "Nothing here yet",
    "empty.subtitle": "Start by creating a new item.",
    "settings.language": "Language",
    "settings.theme": "Theme",
    "settings.mode": "Mode",
  },
  es: {
    "nav.dashboard": "Panel",
    "nav.workspace": "Workspace",
    "nav.projects": "Proyectos",
    "nav.explorer": "Explorer",
    "nav.favorites": "Favoritos",
    "nav.templates": "Plantillas",
    "nav.library": "Biblioteca",
    "nav.trash": "Papelera",
    "nav.settings": "Ajustes",
    "nav.admin": "Administrador",
    "search.placeholder": "Buscar specs, proyectos, tags…",
    "dashboard.title": "Panel",
    "dashboard.subtitle": "Vista general de la plataforma",
    "cards.projects": "Proyectos",
    "cards.specs": "Especificaciones",
    "cards.sprints": "Sprints",
    "cards.users": "Usuarios",
    "cards.templates": "Plantillas",
    "cards.lastSync": "Última sincronización",
    "empty.title": "Nada por aquí aún",
    "empty.subtitle": "Empieza creando un nuevo elemento.",
    "settings.language": "Idioma",
    "settings.theme": "Tema",
    "settings.mode": "Modo",
  },
};

interface I18nState {
  locale: Locale;
  setLocale: (l: Locale) => void;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set) => ({ locale: "pt-BR", setLocale: (locale) => set({ locale }) }),
    { name: "specforge:i18n" },
  ),
);

export function useT(): (key: string) => string {
  const locale = useI18nStore((s) => s.locale);
  return (key) => dict[locale][key] ?? key;
}
