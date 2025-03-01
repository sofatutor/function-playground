import en from '@/locales/en.json';
import de from '@/locales/de.json';
import { useConfig } from '@/context/ConfigContext';

const translations = {
  en,
  de
};

// Helper function to get nested properties using dot notation
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((prev, curr) => {
    return prev && prev[curr] !== undefined ? prev[curr] : undefined;
  }, obj);
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
