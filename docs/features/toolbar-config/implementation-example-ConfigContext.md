# Implementation Example: ConfigContext Updates

This document shows the implementation example for updating the `ConfigContext.tsx` file to support the new toolbar visibility and default tool selection features.

## Changes to GlobalConfigContextType

```typescript
// src/context/ConfigContext.tsx

// Updated GlobalConfigContextType
type GlobalConfigContextType = {
  // Existing settings
  language: string;
  setLanguage: (language: string) => void;
  
  openaiApiKey: string | null;
  setOpenaiApiKey: (key: string | null) => Promise<void>;
  
  loggingEnabled: boolean;
  setLoggingEnabled: (enabled: boolean) => void;
  
  isGlobalConfigModalOpen: boolean;
  setGlobalConfigModalOpen: (isOpen: boolean) => void;
  
  // New settings for toolbar
  isToolbarVisible: boolean;
  setToolbarVisible: (visible: boolean) => void;
  
  defaultTool: string; // 'select', 'rectangle', 'circle', 'triangle', 'line', 'function'
  setDefaultTool: (tool: string) => void;
};
```

## Update to STORAGE_KEYS

```typescript
// Constants for localStorage keys
const STORAGE_KEYS = {
  // Existing keys
  LANGUAGE: 'lang',
  OPENAI_API_KEY: '_gp_oai_k',
  MEASUREMENT_UNIT: 'mu',
  LOGGING_ENABLED: LOGGER_STORAGE_KEY,
  
  // New keys
  TOOLBAR_VISIBLE: 'tb_vis',
  DEFAULT_TOOL: 'def_tool',
};
```

## Update ConfigProvider Component

```typescript
const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Existing state variables
  const [language, setLanguage] = useState<string>(() => {
    const storedLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return storedLanguage || navigator.language.split('-')[0] || 'en';
  });
  
  const [openaiApiKey, setOpenaiApiKeyState] = useState<string | null>(null);
  const [isGlobalConfigModalOpen, setGlobalConfigModalOpen] = useState<boolean>(false);
  const [loggingEnabled, setLoggingEnabledState] = useState<boolean>(isLoggingEnabled);
  
  // Component-specific settings
  const [pixelsPerUnit, setPixelsPerUnit] = useState<number>(60);
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>(() => {
    const storedUnit = localStorage.getItem(STORAGE_KEYS.MEASUREMENT_UNIT);
    return (storedUnit as MeasurementUnit) || 'cm';
  });
  
  const [isComponentConfigModalOpen, setComponentConfigModalOpen] = useState<boolean>(false);
  
  // New state variables for toolbar configuration
  const [isToolbarVisible, setToolbarVisibleState] = useState<boolean>(() => {
    const storedValue = localStorage.getItem(STORAGE_KEYS.TOOLBAR_VISIBLE);
    return storedValue === null ? true : storedValue === 'true';
  });
  
  const [defaultTool, setDefaultToolState] = useState<string>(() => {
    const storedValue = localStorage.getItem(STORAGE_KEYS.DEFAULT_TOOL);
    return storedValue || 'select';
  });
  
  // ... existing useEffects and functions ...
  
  // Function to update toolbar visibility
  const setToolbarVisible = useCallback((visible: boolean) => {
    setToolbarVisibleState(visible);
    localStorage.setItem(STORAGE_KEYS.TOOLBAR_VISIBLE, visible.toString());
  }, []);
  
  // Function to update default tool
  const setDefaultTool = useCallback((tool: string) => {
    setDefaultToolState(tool);
    localStorage.setItem(STORAGE_KEYS.DEFAULT_TOOL, tool);
  }, []);
  
  // Update the global context value
  const globalContextValue: GlobalConfigContextType = {
    // Existing values
    language,
    setLanguage,
    openaiApiKey,
    setOpenaiApiKey,
    loggingEnabled,
    setLoggingEnabled: handleSetLoggingEnabled,
    isGlobalConfigModalOpen,
    setGlobalConfigModalOpen,
    
    // New values
    isToolbarVisible,
    setToolbarVisible,
    defaultTool,
    setDefaultTool,
  };
  
  // ... rest of the component ...
}
```

This implementation:

1. Adds new types to the GlobalConfigContextType
2. Adds new storage keys for persisting the settings
3. Creates new state variables with default values
4. Adds setter functions that update both state and localStorage
5. Exposes the new values and setters through the context

The next step would be to update the ConfigModal component to expose these settings in the UI and then modify the Index component to use these settings. 