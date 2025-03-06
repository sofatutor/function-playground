
import { useConfig } from "@/context/ConfigContext";
import { translations } from "./translations";

export function useTranslation() {
  const { language } = useConfig();

  const getTranslation = (key: string): string => {
    // Split the key by dots to traverse nested objects
    const keys = key.split('.');
    let result: any = translations[language] || translations.en;

    // Traverse the nested objects
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        // If the key doesn't exist, try English as fallback
        const fallback = translations.en;
        let fallbackResult = fallback;
        for (const fallbackKey of keys) {
          if (fallbackResult && typeof fallbackResult === 'object' && fallbackKey in fallbackResult) {
            fallbackResult = fallbackResult[fallbackKey];
          } else {
            return key; // Return the key if not found in fallback
          }
        }
        return typeof fallbackResult === 'string' ? fallbackResult : key;
      }
    }

    return typeof result === 'string' ? result : key;
  };

  return getTranslation;
}
