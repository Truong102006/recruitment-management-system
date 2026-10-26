import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Language, LanguageContextType } from './types';
import { translations } from './translations';

const STORAGE_KEY = 'talento_language';

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'vi' || saved === 'en') {
        return saved;
      }
    } catch {
      // Ignore localStorage errors
    }
    return 'vi';
  });

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
      document.documentElement.lang = newLang;
    } catch {
      // Ignore localStorage errors
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  }, [language, setLanguage]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (keyPath: string, params?: Record<string, string | number>): string => {
      const keys = keyPath.split('.');

      const lookup = (obj: unknown): string | undefined => {
        let cur: unknown = obj;
        for (const k of keys) {
          if (cur && typeof cur === 'object' && k in (cur as Record<string, unknown>)) {
            cur = (cur as Record<string, unknown>)[k];
          } else {
            return undefined;
          }
        }
        return typeof cur === 'string' ? cur : undefined;
      };

      const translated = lookup(translations[language]) || lookup(translations.vi) || keyPath;

      if (params) {
        return Object.entries(params).reduce((str, [k, val]) => {
          return str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(val));
        }, translated);
      }

      return translated;
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
    }),
    [language, setLanguage, toggleLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

const defaultT = (keyPath: string, params?: Record<string, string | number>): string => {
  const keys = keyPath.split('.');
  let cur: unknown = translations.vi;
  for (const k of keys) {
    if (cur && typeof cur === 'object' && k in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[k];
    } else {
      cur = undefined;
      break;
    }
  }
  const translated = typeof cur === 'string' ? cur : keyPath;
  if (params) {
    return Object.entries(params).reduce((str, [k, val]) => {
      return str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(val));
    }, translated);
  }
  return translated;
};

const defaultContextValue: LanguageContextType = {
  language: 'vi',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: defaultT,
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  return context || defaultContextValue;
}

export const useTranslation = useLanguage;
