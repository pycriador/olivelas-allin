import React, { createContext, useContext, useState, useEffect } from 'react';
import { SupportedLocale } from '../types';
import { TRANSLATIONS } from './translations';

interface I18nContextType {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: (key: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'pt-BR',
  setLocale: () => {},
  t: (key, fallback) => fallback || key,
});

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<SupportedLocale>(() => {
    const saved = localStorage.getItem('olivelas_forms_locale');
    if (saved === 'en' || saved === 'es' || saved === 'pt-BR') {
      return saved;
    }
    return 'pt-BR';
  });

  const setLocale = (newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    localStorage.setItem('olivelas_forms_locale', newLocale);
  };

  const t = (key: string, fallback?: string): string => {
    const dict = TRANSLATIONS[locale];
    if (dict && dict[key]) {
      return dict[key];
    }
    // Fallback to pt-BR if present
    if (TRANSLATIONS['pt-BR'] && TRANSLATIONS['pt-BR'][key]) {
      return TRANSLATIONS['pt-BR'][key];
    }
    return fallback || key;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => useContext(I18nContext);
