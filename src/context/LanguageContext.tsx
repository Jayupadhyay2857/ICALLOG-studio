import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SUPPORTED_LANGUAGES,
  LanguageOption,
  TranslationKey,
  getTranslation,
} from '../lib/i18n.ts';

interface LanguageContextType {
  currentLanguage: string;
  setLanguage: (lang: string) => void;
  t: (key: TranslationKey) => string;
  currentLangOption: LanguageOption;
  allLanguages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{
  children: React.ReactNode;
  initialLanguage?: string;
  onLanguageChange?: (lang: string) => void;
}> = ({ children, initialLanguage, onLanguageChange }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<string>(() => {
    if (initialLanguage) return initialLanguage;
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('icallog_preferred_language_v1');
      if (saved) return saved;
      // Auto-detect browser language if available and supported
      const navLang = navigator.language?.split('-')[0]?.toLowerCase();
      if (navLang && SUPPORTED_LANGUAGES.some((l) => l.code === navLang)) {
        return navLang;
      }
    }
    return 'en';
  });

  const setLanguage = (lang: string) => {
    const normalized = lang.toLowerCase();
    setCurrentLanguageState(normalized);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('icallog_preferred_language_v1', normalized);
      } catch {
        // ignore
      }
      const option = SUPPORTED_LANGUAGES.find((l) => l.code === normalized);
      if (option) {
        document.documentElement.lang = option.code;
        document.documentElement.dir = option.dir || 'ltr';
      }
    }
    if (onLanguageChange) {
      onLanguageChange(normalized);
    }
  };

  useEffect(() => {
    if (initialLanguage && initialLanguage !== currentLanguage) {
      setLanguage(initialLanguage);
    }
  }, [initialLanguage]);

  useEffect(() => {
    const option = SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage);
    if (option && typeof document !== 'undefined') {
      document.documentElement.lang = option.code;
      document.documentElement.dir = option.dir || 'ltr';
    }
  }, [currentLanguage]);

  const currentLangOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) ||
    SUPPORTED_LANGUAGES[0];

  const t = (key: TranslationKey): string => {
    return getTranslation(key, currentLanguage);
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        t,
        currentLangOption,
        allLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if used outside provider
    const fallbackLang = 'en';
    const fallbackOption = SUPPORTED_LANGUAGES[0];
    return {
      currentLanguage: fallbackLang,
      setLanguage: () => {},
      t: (key: TranslationKey) => getTranslation(key, fallbackLang),
      currentLangOption: fallbackOption,
      allLanguages: SUPPORTED_LANGUAGES,
    };
  }
  return context;
}
