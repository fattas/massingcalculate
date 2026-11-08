import { createContext, useContext, useState, useEffect } from 'react';
import { LANGUAGES, translations } from './translations';

const LanguageContext = createContext(null);

const LOCALE_MAP = {
  id: 'id-ID',
  en: 'en-US',
  fi: 'fi-FI',
  es: 'es-ES',
  tr: 'tr-TR',
  ru: 'ru-RU',
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('gt-language');
      if (saved && translations[saved]) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'id'; // Default to Indonesian
  });

  const setLanguage = (langCode) => {
    if (translations[langCode]) {
      setLanguageState(langCode);
      try {
        localStorage.setItem('gt-language', langCode);
      } catch {
        // ignore
      }
    }
  };

  // Translation function with parameter interpolation
  const t = (key, params = {}) => {
    let str = translations[language]?.[key] || translations['id']?.[key] || translations['en']?.[key] || key;
    if (typeof str !== 'string') return key;

    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      });
    }
    return str;
  };

  // Format seconds into localized time string
  const formatTimeLocalized = (totalSeconds) => {
    if (!totalSeconds || totalSeconds <= 0) {
      return `0 ${t('time_seconds')}`;
    }
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    const parts = [];
    if (hours > 0) parts.push(`${hours} ${t('time_hours')}`);
    if (minutes > 0) parts.push(`${minutes} ${t('time_minutes')}`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds} ${t('time_seconds')}`);
    
    return parts.join(' ').trim();
  };

  // Format number with current language locale
  const formatNumberLocalized = (num) => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    const locale = LOCALE_MAP[language] || 'id-ID';
    return new Intl.NumberFormat(locale).format(num);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        formatTimeLocalized,
        formatNumberLocalized,
        LANGUAGES,
        currentLanguageObj: LANGUAGES.find((l) => l.code === language) || LANGUAGES[0],
      }}
    >
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
