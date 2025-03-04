
import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { MeasurementUnit } from '@/types/shapes';

type Language = 'en' | 'es' | 'fr' | 'de';

interface ConfigContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  measurementUnit: MeasurementUnit;
  setMeasurementUnit: (unit: MeasurementUnit) => void;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

interface ConfigProviderProps {
  children: ReactNode;
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>('cm');

  return (
    <ConfigContext.Provider value={{ 
      language, 
      setLanguage,
      measurementUnit,
      setMeasurementUnit
    }}>
      {children}
    </ConfigContext.Provider>
  );
};

export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (context === undefined) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
