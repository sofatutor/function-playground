import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { MeasurementUnit } from '@/types/shapes';
import { encryptData, decryptData } from '@/utils/encryption';
import { setLoggingEnabled, isLoggingEnabled, LOGGER_STORAGE_KEY } from '@/utils/logger';

// Constants for localStorage keys (non-human readable)
const STORAGE_KEYS = {
  LANGUAGE: 'lang',
  OPENAI_API_KEY: '_gp_oai_k',
  MEASUREMENT_UNIT: 'mu',
  LOGGING_ENABLED: LOGGER_STORAGE_KEY
};

// Separate types for global vs component settings
type GlobalConfigContextType = {
  // Global application settings
  language: string;
  setLanguage: (language: string) => void;
  
  // OpenAI API settings
  openaiApiKey: string | null;
  setOpenaiApiKey: (key: string | null) => Promise<void>;
  
  // Logging settings
  loggingEnabled: boolean;
  setLoggingEnabled: (enabled: boolean) => void;
  
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

// Provider component that combines both contexts
const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Global settings
  const [language, setLanguage] = useState<string>(() => {
    const storedLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return storedLanguage || navigator.language.split('-')[0] || 'en';
  });
  
  const [openaiApiKey, setOpenaiApiKeyState] = useState<string | null>(null);
  const [isGlobalConfigModalOpen, setGlobalConfigModalOpen] = useState<boolean>(false);
  
  // Logging settings
  const [loggingEnabled, setLoggingEnabledState] = useState<boolean>(isLoggingEnabled);
  
  // Component-specific settings
  const [pixelsPerUnit, setPixelsPerUnit] = useState<number>(60); // Default: 60 pixels per unit
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>(() => {
    const storedUnit = localStorage.getItem(STORAGE_KEYS.MEASUREMENT_UNIT);
    return (storedUnit as MeasurementUnit) || 'cm';
  });
  
  const [isComponentConfigModalOpen, setComponentConfigModalOpen] = useState<boolean>(false);
  
  // Load the API key from localStorage on initial render
  useEffect(() => {
    const loadApiKey = async () => {
      const storedKey = localStorage.getItem(STORAGE_KEYS.OPENAI_API_KEY);
      console.log('Retrieved from localStorage:', storedKey ? '(encrypted key)' : '(no key)');
      
      if (storedKey) {
        try {
          // Try to decrypt with the new method
          const decrypted = await decryptData(storedKey);
          
          if (decrypted) {
            console.log('Decrypted key with new method:', '(valid key)');
            setOpenaiApiKeyState(decrypted);
          } else {
            // If new method fails, try the old method (btoa)
            try {
              const decoded = atob(storedKey);
              const oldKey = decoded.split('_')[0];
              
              if (oldKey) {
                console.log('Migrating from old encryption method');
                // Migrate to new encryption
                setOpenaiApiKey(oldKey);
              } else {
                setOpenaiApiKeyState(null);
              }
            } catch (oldMethodError) {
              console.error('Failed to decrypt with old method', oldMethodError);
              setOpenaiApiKeyState(null);
            }
          }
        } catch (e) {
          console.error('Failed to decrypt stored API key', e);
          setOpenaiApiKeyState(null);
        }
      }
    };
    
    loadApiKey();
  }, []);
  
  // Handle setting the OpenAI API key with encryption
  const setOpenaiApiKey = async (key: string | null) => {
    setOpenaiApiKeyState(key);
    
    if (key) {
      try {
        const encrypted = await encryptData(key);
        localStorage.setItem(STORAGE_KEYS.OPENAI_API_KEY, encrypted);
        
        // Debug: Verify encryption/decryption is working
        const decrypted = await decryptData(encrypted);
        console.log('Encryption test:', {
          matches: key === decrypted
        });
      } catch (e) {
        console.error('Failed to encrypt and store API key', e);
      }
    } else {
      localStorage.removeItem(STORAGE_KEYS.OPENAI_API_KEY);
    }
  };
  
  // Persist language changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, language);
  }, [language]);
  
  // Persist measurement unit changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEASUREMENT_UNIT, measurementUnit);
  }, [measurementUnit]);
  
  // Handle setting the logging enabled state
  const handleSetLoggingEnabled = (enabled: boolean) => {
    setLoggingEnabledState(enabled);
    setLoggingEnabled(enabled);
  };
  
  // Global context value
  const globalContextValue: GlobalConfigContextType = {
    language,
    setLanguage,
    openaiApiKey,
    setOpenaiApiKey,
    loggingEnabled,
    setLoggingEnabled: handleSetLoggingEnabled,
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
