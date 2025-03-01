
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
    },
    circumference: {
      en: '\\text{circumference} = 2\\pi r',
      de: '\\text{Kreisumfang} = 2\\pi r',
      es: '\\text{circunferencia} = 2\\pi r',
      fr: '\\text{circonférence} = 2\\pi r'
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
    },
    angle1: {
      en: '\\text{Law of cosines: } \\cos(A) = \\frac{b^2 + c^2 - a^2}{2bc}',
      de: '\\text{Kosinussatz: } \\cos(A) = \\frac{b^2 + c^2 - a^2}{2bc}',
      es: '\\text{Ley de cosenos: } \\cos(A) = \\frac{b^2 + c^2 - a^2}{2bc}',
      fr: '\\text{Loi des cosinus: } \\cos(A) = \\frac{b^2 + c^2 - a^2}{2bc}'
    },
    angle2: {
      en: '\\text{Law of cosines: } \\cos(B) = \\frac{a^2 + c^2 - b^2}{2ac}',
      de: '\\text{Kosinussatz: } \\cos(B) = \\frac{a^2 + c^2 - b^2}{2ac}',
      es: '\\text{Ley de cosenos: } \\cos(B) = \\frac{a^2 + c^2 - b^2}{2ac}',
      fr: '\\text{Loi des cosinus: } \\cos(B) = \\frac{a^2 + c^2 - b^2}{2ac}'
    },
    angle3: {
      en: '\\text{Sum of angles: } C = 180° - A - B',
      de: '\\text{Winkelsumme: } C = 180° - A - B',
      es: '\\text{Suma de ángulos: } C = 180° - A - B',
      fr: '\\text{Somme des angles: } C = 180° - A - B'
    }
  },
  line: {
    length: {
      en: '\\text{length} = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}',
      de: '\\text{Länge} = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}',
      es: '\\text{longitud} = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}',
      fr: '\\text{longueur} = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}'
    },
    angle: {
      en: '\\text{angle} = \\tan^{-1}\\left(\\frac{y_2 - y_1}{x_2 - x_1}\\right)',
      de: '\\text{Winkel} = \\tan^{-1}\\left(\\frac{y_2 - y_1}{x_2 - x_1}\\right)',
      es: '\\text{ángulo} = \\tan^{-1}\\left(\\frac{y_2 - y_1}{x_2 - x_1}\\right)',
      fr: '\\text{angle} = \\tan^{-1}\\left(\\frac{y_2 - y_1}{x_2 - x_1}\\right)'
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
