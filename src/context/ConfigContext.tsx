import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { MeasurementUnit } from '@/types/shapes';

// Define the configuration type
type ConfigContextType = {
  // Language settings
  language: string;
  setLanguage: (language: string) => void;
  
  // OpenAI API settings
  openaiApiKey: string | null;
  setOpenaiApiKey: (key: string | null) => void;
  
  // Screen calibration settings
  pixelsPerUnit: number;
  setPixelsPerUnit: (pixels: number) => void;
  measurementUnit: MeasurementUnit;
  setMeasurementUnit: (unit: MeasurementUnit) => void;
  
  // Modal control
  isConfigModalOpen: boolean;
  setConfigModalOpen: (isOpen: boolean) => void;
};

// Create the context
const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

// Encryption/decryption functions for API key
const encryptApiKey = (key: string): string => {
  // Simple encryption for local storage - in a real app, use a more secure method
  return btoa(`geo-playground-key:${key}`);
};

const decryptApiKey = (encryptedKey: string): string => {
  try {
    const decoded = atob(encryptedKey);
    if (decoded.startsWith('geo-playground-key:')) {
      return decoded.replace('geo-playground-key:', '');
    }
    return '';
  } catch (e) {
    return '';
  }
};

const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state with default values
  const [language, setLanguage] = useState('en');
  const [openaiApiKey, setOpenaiApiKeyState] = useState<string | null>(null);
  const [pixelsPerUnit, setPixelsPerUnit] = useState(60); // Default: 60 pixels per unit
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>('cm');
  const [isConfigModalOpen, setConfigModalOpen] = useState(false);

  // Load saved values from localStorage on initial render
  useEffect(() => {
    // Load language
    const savedLanguage = localStorage.getItem('geo-playground-language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    // Load API key (encrypted)
    const savedApiKey = localStorage.getItem('geo-playground-openai-key');
    if (savedApiKey) {
      setOpenaiApiKeyState(decryptApiKey(savedApiKey));
    }

    // Load calibration settings
    const savedPixelsPerUnit = localStorage.getItem('geo-playground-pixels-per-unit');
    if (savedPixelsPerUnit) {
      setPixelsPerUnit(parseFloat(savedPixelsPerUnit));
    }

    const savedMeasurementUnit = localStorage.getItem('geo-playground-measurement-unit') as MeasurementUnit;
    if (savedMeasurementUnit) {
      setMeasurementUnit(savedMeasurementUnit);
    }
  }, []);

  // Custom setter for API key that also saves to localStorage
  const setOpenaiApiKey = (key: string | null) => {
    setOpenaiApiKeyState(key);
    if (key) {
      localStorage.setItem('geo-playground-openai-key', encryptApiKey(key));
    } else {
      localStorage.removeItem('geo-playground-openai-key');
    }
  };

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('geo-playground-language', language);
  }, [language]);

  // Save calibration settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('geo-playground-pixels-per-unit', pixelsPerUnit.toString());
  }, [pixelsPerUnit]);

  useEffect(() => {
    localStorage.setItem('geo-playground-measurement-unit', measurementUnit);
  }, [measurementUnit]);

  return (
    <ConfigContext.Provider 
      value={{ 
        language, 
        setLanguage, 
        openaiApiKey, 
        setOpenaiApiKey,
        pixelsPerUnit,
        setPixelsPerUnit,
        measurementUnit,
        setMeasurementUnit,
        isConfigModalOpen,
        setConfigModalOpen
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

export { ConfigProvider, useConfig };
