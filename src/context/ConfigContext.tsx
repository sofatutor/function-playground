import React, { createContext, useContext, useState, ReactNode } from 'react';

type ConfigContextType = {
  language: string;
  setLanguage: (language: string) => void;
};

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState('en');

  return (
    <ConfigContext.Provider value={{ language, setLanguage }}>
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
