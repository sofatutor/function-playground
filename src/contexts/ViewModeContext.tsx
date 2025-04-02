import React, { createContext, useContext, useEffect, useState } from 'react';
import { ViewMode, detectViewMode } from '@/utils/viewDetection';

interface ViewModeContextType {
  viewMode: ViewMode;
  isEmbedded: boolean;
  isFullscreen: boolean;
  isStandalone: boolean;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>(detectViewMode());

  useEffect(() => {
    const handleFullscreenChange = () => {
      setViewMode(detectViewMode());
    };

    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  const value = {
    viewMode,
    isEmbedded: viewMode === 'embedded',
    isFullscreen: viewMode === 'fullscreen',
    isStandalone: viewMode === 'standalone',
  };

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
} 