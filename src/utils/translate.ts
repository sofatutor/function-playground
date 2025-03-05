import en from '@/locales/en.json';
import de from '@/locales/de.json';
import es from '@/locales/es.json';
import fr from '@/locales/fr.json';
import { useConfig } from '@/context/ConfigContext';
import { translations as i18nTranslations } from '@/i18n/translations';

// Define language names for the UI
export const languageNames = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français'
};

// Export available languages for use in other components
export const availableLanguages = Object.keys(languageNames);

// Merge translations from locale files with i18n translations
const translations = {
  en: { ...en, ...i18nTranslations.en },
  de: { ...de, ...i18nTranslations.de },
  es: { ...es, ...i18nTranslations.es },
  fr: { ...fr, ...i18nTranslations.fr }
};

// Define a type for nested translation objects
type NestedTranslation = {
  [key: string]: string | number | boolean | NestedTranslation;
};

// Helper function to get nested properties using dot notation
const getNestedValue = (obj: NestedTranslation, path: string): string | number | boolean | NestedTranslation | undefined => {
  return path.split('.').reduce<string | number | boolean | NestedTranslation | undefined>((prev, curr) => {
    return prev && typeof prev === 'object' ? prev[curr] : undefined;
  }, obj as NestedTranslation);
};

export const useTranslate = () => {
  const { language } = useConfig();
  return (key: string, replacements?: Record<string, string>) => {
    let translation = getNestedValue(translations[language], key);
    if (translation !== undefined && typeof translation === 'string' && replacements) {
      Object.keys(replacements).forEach((placeholder) => {
        translation = (translation as string).replace(`{${placeholder}}`, replacements[placeholder]);
      });
    }
    return translation !== undefined ? String(translation) : key;
  };
};
