import React, { createContext, useContext, useState, ReactNode } from 'react';

interface SharePanelContextType {
  isSharePanelOpen: boolean;
  setIsSharePanelOpen: (open: boolean) => void;
}

const SharePanelContext = createContext<SharePanelContextType>({
  isSharePanelOpen: false,
  setIsSharePanelOpen: () => {
    // Default implementation - will be overridden by provider
  },
});

interface SharePanelProviderProps {
  children: ReactNode;
}

export const SharePanelProvider: React.FC<SharePanelProviderProps> = ({ children }) => {
  const [isSharePanelOpen, setIsSharePanelOpen] = useState(false);

  const contextValue = React.useMemo(() => ({
    isSharePanelOpen,
    setIsSharePanelOpen,
  }), [isSharePanelOpen]);

  return (
    <SharePanelContext.Provider value={contextValue}>
      {children}
    </SharePanelContext.Provider>
  );
};

export const useSharePanel = () => {
  const context = useContext(SharePanelContext);
  if (!context) {
    throw new Error('useSharePanel must be used within a SharePanelProvider');
  }
  return context;
};