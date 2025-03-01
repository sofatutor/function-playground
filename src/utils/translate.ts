import en from '@/locales/en.json';
import de from '@/locales/de.json';
import es from '@/locales/es.json';
import fr from '@/locales/fr.json';
import { useConfig } from '@/context/ConfigContext';

// Define language names for the UI
export const languageNames = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français'
};

// Export available languages for use in other components
export const availableLanguages = Object.keys(languageNames);

const translations = {
  en,
  de,
  es,
  fr
};

// Define a type for nested translation objects
type NestedTranslation = {
  [key: string]: string | number | boolean | NestedTranslation;
};

// Helper function to get nested properties using dot notation
const getNestedValue = (obj: NestedTranslation, path: string): any => {
  return path.split('.').reduce((prev, curr) => {
    return prev && typeof prev === 'object' ? prev[curr] : undefined;
  }, obj as any);
};

export const useTranslate = () => {
  const { language } = useConfig();
  return (key: string, replacements?: Record<string, string>) => {
    let translation = getNestedValue(translations[language], key);
    if (translation !== undefined && replacements) {
      Object.keys(replacements).forEach((placeholder) => {
        translation = translation.replace(`{${placeholder}}`, replacements[placeholder]);
      });
    }
    return translation !== undefined ? translation : key;
  };
};
