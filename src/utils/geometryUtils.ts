import { ShapeType } from '@/types/shapes';
import en from '@/locales/en.json';
import de from '@/locales/de.json';
import es from '@/locales/es.json';
import fr from '@/locales/fr.json';

// Combine all translations
const translations = {
  en,
  de,
  es,
  fr
};

// Formula templates for different shapes and measurements
export const formulas = {
  circle: {
    area: {
      en: '\\text{area} = \\pi r^2',
      de: '\\text{Fläche} = \\pi r^2',
      es: '\\text{área} = \\pi r^2',
      fr: '\\text{aire} = \\pi r^2'
    },
    perimeter: {
      en: '\\text{perimeter} = 2\\pi r',
      de: '\\text{Umfang} = 2\\pi r',
      es: '\\text{perímetro} = 2\\pi r',
      fr: '\\text{périmètre} = 2\\pi r'
    }
  },
  rectangle: {
    area: {
      en: '\\text{area} = w \\times h',
      de: '\\text{Fläche} = w \\times h',
      es: '\\text{área} = w \\times h',
      fr: '\\text{aire} = w \\times h'
    },
    perimeter: {
      en: '\\text{perimeter} = 2(w + h)',
      de: '\\text{Umfang} = 2(w + h)',
      es: '\\text{perímetro} = 2(w + h)',
      fr: '\\text{périmètre} = 2(w + h)'
    }
  },
  triangle: {
    area: {
      en: '\\text{area} = \\frac{1}{2} \\times \\text{base} \\times \\text{height}',
      de: '\\text{Fläche} = \\frac{1}{2} \\times \\text{Basis} \\times \\text{Höhe}',
      es: '\\text{área} = \\frac{1}{2} \\times \\text{base} \\times \\text{altura}',
      fr: '\\text{aire} = \\frac{1}{2} \\times \\text{base} \\times \\text{hauteur}'
    },
    perimeter: {
      en: '\\text{perimeter} = a + b + c',
      de: '\\text{Umfang} = a + b + c',
      es: '\\text{perímetro} = a + b + c',
      fr: '\\text{périmètre} = a + b + c'
    },
    height: {
      en: '\\text{height} = \\frac{2 \\times \\text{area}}{\\text{base}}',
      de: '\\text{Höhe} = \\frac{2 \\times \\text{Fläche}}{\\text{Basis}}',
      es: '\\text{altura} = \\frac{2 \\times \\text{área}}{\\text{base}}',
      fr: '\\text{hauteur} = \\frac{2 \\times \\text{aire}}{\\text{base}}'
    },
    angles: {
      en: '\\text{angles: } \\alpha + \\beta + \\gamma = 180°',
      de: '\\text{Winkel: } \\alpha + \\beta + \\gamma = 180°',
      es: '\\text{ángulos: } \\alpha + \\beta + \\gamma = 180°',
      fr: '\\text{angles: } \\alpha + \\beta + \\gamma = 180°'
    }
  }
};

/**
 * Get the formula for a specific measurement of a shape
 */
export const getFormula = (shapeType: ShapeType, measurementKey: string, language: string = 'en'): string => {
  if (!formulas[shapeType] || !formulas[shapeType][measurementKey]) {
    return '';
  }
  return formulas[shapeType][measurementKey][language] || formulas[shapeType][measurementKey]['en'];
};

/**
 * Get a more detailed explanation of how the measurement is calculated
 */
export const getFormulaExplanation = (shapeType: ShapeType, measurementKey: string, language: string = 'en'): string => {
  // Try to get the explanation from the locale files
  const translationKey = `formulaExplanations.${shapeType}.${measurementKey}`;
  const localeExplanation = translations[language]?.formulaExplanations?.[shapeType]?.[measurementKey];
  
  // If we have a translation, return it
  if (localeExplanation) {
    return localeExplanation;
  }
  
  // Fallback to English if no translation is available
  return translations.en?.formulaExplanations?.[shapeType]?.[measurementKey] || '';
};
