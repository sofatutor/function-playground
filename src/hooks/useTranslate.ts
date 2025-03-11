import { translations } from '@/i18n/translations';

// Get the user's language, defaulting to 'en'
const getUserLanguage = (): 'en' | 'de' | 'es' | 'fr' => {
  // Try to get the language from localStorage first
  const storedLang = localStorage.getItem('language');
  if (storedLang && ['en', 'de', 'es', 'fr'].includes(storedLang)) {
    return storedLang as 'en' | 'de' | 'es' | 'fr';
  }

  // Otherwise use browser language, defaulting to 'en'
  const browserLang = navigator.language.split('-')[0];
  return ['en', 'de', 'es', 'fr'].includes(browserLang) 
    ? browserLang as 'en' | 'de' | 'es' | 'fr'
    : 'en';
};

export const useTranslate = () => {
  const lang = getUserLanguage();
  
  return (key: keyof typeof translations['en']) => {
    return translations[lang][key] || translations['en'][key] || key;
  };
}; 