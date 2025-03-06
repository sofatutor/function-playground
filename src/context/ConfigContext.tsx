import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { MeasurementUnit } from '@/types/shapes';

// Separate types for global vs component settings
type GlobalConfigContextType = {
  // Global application settings
  language: string;
  setLanguage: (language: string) => void;
  
  // OpenAI API settings
  openaiApiKey: string | null;
  setOpenaiApiKey: (key: string | null) => void;
  
  // Modal control for global settings
  isGlobalConfigModalOpen: boolean;
  setGlobalConfigModalOpen: (isOpen: boolean) => void;
};

type ComponentConfigContextType = {
  // Component-specific settings
  pixelsPerUnit: number;
  setPixelsPerUnit: (pixels: number) => void;
  measurementUnit: MeasurementUnit;
  setMeasurementUnit: (unit: MeasurementUnit) => void;
  
  // Modal control for component settings
  isComponentConfigModalOpen: boolean;
  setComponentConfigModalOpen: (isOpen: boolean) => void;
};

// Combined type for backward compatibility
export type ConfigContextType = GlobalConfigContextType & ComponentConfigContextType & {
  // For backward compatibility
  isConfigModalOpen: boolean;
  setConfigModalOpen: (isOpen: boolean) => void;
};

// Create separate contexts
const GlobalConfigContext = createContext<GlobalConfigContextType | undefined>(undefined);
const ComponentConfigContext = createContext<ComponentConfigContextType | undefined>(undefined);

// Encryption utilities for sensitive data
const encryptApiKey = (key: string): string => {
  // Simple encryption for demo purposes
  // In production, use a more secure method
  return btoa(`${key}_${new Date().getTime()}`);
};

const decryptApiKey = (encryptedKey: string): string => {
  // Simple decryption for demo purposes
  try {
    const decoded = atob(encryptedKey);
    return decoded.split('_')[0];
  } catch (e) {
    console.error('Failed to decrypt API key', e);
    return '';
  }
};

// Provider component that combines both contexts
const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Global settings
  const [language, setLanguage] = useState<string>(() => {
    const storedLanguage = localStorage.getItem('language');
    return storedLanguage || navigator.language.split('-')[0] || 'en';
  });
  
  const [openaiApiKey, setOpenaiApiKeyState] = useState<string | null>(() => {
    const storedKey = localStorage.getItem('openai_api_key');
    if (storedKey) {
      try {
        return decryptApiKey(storedKey);
      } catch (e) {
        console.error('Failed to decrypt stored API key', e);
        return null;
      }
    }
    return null;
  });
  
  const [isGlobalConfigModalOpen, setGlobalConfigModalOpen] = useState<boolean>(false);
  
  // Component-specific settings
  const [pixelsPerUnit, setPixelsPerUnit] = useState<number>(60); // Default: 60 pixels per unit
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>(() => {
    const storedUnit = localStorage.getItem('measurement_unit');
    return (storedUnit as MeasurementUnit) || 'cm';
  });
  
  const [isComponentConfigModalOpen, setComponentConfigModalOpen] = useState<boolean>(false);
  
  // Handle setting the OpenAI API key with encryption
  const setOpenaiApiKey = (key: string | null) => {
    setOpenaiApiKeyState(key);
    if (key) {
      localStorage.setItem('openai_api_key', encryptApiKey(key));
    } else {
      localStorage.removeItem('openai_api_key');
    }
  };
  
  // Persist language changes
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);
  
  // Persist measurement unit changes
  useEffect(() => {
    localStorage.setItem('measurement_unit', measurementUnit);
  }, [measurementUnit]);
  
  // Global context value
  const globalContextValue: GlobalConfigContextType = {
    language,
    setLanguage,
    openaiApiKey,
    setOpenaiApiKey,
    isGlobalConfigModalOpen,
    setGlobalConfigModalOpen,
  };
  
  // Component context value
  const componentContextValue: ComponentConfigContextType = {
    pixelsPerUnit,
    setPixelsPerUnit,
    measurementUnit,
    setMeasurementUnit,
    isComponentConfigModalOpen,
    setComponentConfigModalOpen,
  };
  
  // Combined context value for backward compatibility
  const combinedContextValue: ConfigContextType = {
    ...globalContextValue,
    ...componentContextValue,
    // For backward compatibility
    isConfigModalOpen: isGlobalConfigModalOpen,
    setConfigModalOpen: setGlobalConfigModalOpen,
  };
  
  return (
    <GlobalConfigContext.Provider value={globalContextValue}>
      <ComponentConfigContext.Provider value={componentContextValue}>
        {children}
      </ComponentConfigContext.Provider>
    </GlobalConfigContext.Provider>
  );
};

// Custom hooks to use the contexts
const useGlobalConfig = (): GlobalConfigContextType => {
  const context = useContext(GlobalConfigContext);
  if (context === undefined) {
    throw new Error('useGlobalConfig must be used within a ConfigProvider');
  }
  return context;
};

const useComponentConfig = (): ComponentConfigContextType => {
  const context = useContext(ComponentConfigContext);
  if (context === undefined) {
    throw new Error('useComponentConfig must be used within a ConfigProvider');
  }
  return context;
};

// Combined hook for backward compatibility
const useConfig = (): ConfigContextType => {
  const globalConfig = useGlobalConfig();
  const componentConfig = useComponentConfig();
  
  return {
    ...globalConfig,
    ...componentConfig,
    // For backward compatibility
    isConfigModalOpen: globalConfig.isGlobalConfigModalOpen,
    setConfigModalOpen: globalConfig.setGlobalConfigModalOpen,
  };
};

export { ConfigProvider, useGlobalConfig, useComponentConfig, useConfig };
