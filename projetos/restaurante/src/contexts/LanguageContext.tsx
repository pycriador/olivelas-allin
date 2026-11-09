import React, { createContext, useContext, useState, useEffect } from 'react';

export type AppLanguage = 'pt-BR' | 'en' | 'es';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<AppLanguage, Record<string, string>> = {
  'pt-BR': {
    'nav.dashboard': 'Visão geral',
    'nav.restaurant': 'Restaurante',
    'nav.team': 'Equipe',
    'nav.settings': 'Configurações',
    'nav.menu': 'Cardápio',
    'nav.categories': 'Categorias',
    'nav.products': 'Produtos',
    'nav.addons': 'Adicionais',
    'nav.tables': 'Mesas',
    'nav.orders': 'Pedidos',
    'nav.kds': 'Cozinha (KDS)',
    'nav.cashier': 'Caixa & PDV',
    'nav.reports': 'Relatórios',
    'common.actions': 'Ações',
    'common.save': 'Salvar alterações',
    'common.cancel': 'Cancelar',
    'common.delete': 'Excluir',
    'common.edit': 'Editar',
    'common.status': 'Status',
    'common.active': 'Ativo',
    'common.inactive': 'Inativo',
    'common.search': 'Pesquisar...',
  },
  'en': {
    'nav.dashboard': 'Overview',
    'nav.restaurant': 'Restaurant',
    'nav.team': 'Team',
    'nav.settings': 'Settings',
    'nav.menu': 'Menu',
    'nav.categories': 'Categories',
    'nav.products': 'Products',
    'nav.addons': 'Add-ons',
    'nav.tables': 'Tables',
    'nav.orders': 'Orders',
    'nav.kds': 'Kitchen (KDS)',
    'nav.cashier': 'Cashier & POS',
    'nav.reports': 'Reports',
    'common.actions': 'Actions',
    'common.save': 'Save changes',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.status': 'Status',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.search': 'Search...',
  },
  'es': {
    'nav.dashboard': 'Visión general',
    'nav.restaurant': 'Restaurante',
    'nav.team': 'Equipo',
    'nav.settings': 'Configuración',
    'nav.menu': 'Menú',
    'nav.categories': 'Categorías',
    'nav.products': 'Productos',
    'nav.addons': 'Adicionales',
    'nav.tables': 'Mesas',
    'nav.orders': 'Pedidos',
    'nav.kds': 'Cocina (KDS)',
    'nav.cashier': 'Caja & TPV',
    'nav.reports': 'Informes',
    'common.actions': 'Acciones',
    'common.save': 'Guardar cambios',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.status': 'Estado',
    'common.active': 'Activo',
    'common.inactive': 'Inactivo',
    'common.search': 'Buscar...',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = localStorage.getItem('olivelas_preferred_language') as AppLanguage;
    return saved && ['pt-BR', 'en', 'es'].includes(saved) ? saved : 'pt-BR';
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('olivelas_preferred_language', lang);
  };

  const t = (key: string, fallback?: string): string => {
    return translations[language]?.[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
