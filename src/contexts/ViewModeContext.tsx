import React, { createContext, useContext, useEffect, useState } from 'react';
import { ViewMode, detectViewMode } from '@/utils/viewDetection';

interface ViewModeContextType {
  viewMode: ViewMode;
  isEmbedded: boolean;
  isFullscreen: boolean;
  isStandalone: boolean;
  setIsFullscreen: (isFullscreen: boolean) => void;
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

  const setIsFullscreen = (isFullscreen: boolean) => {
    if (isFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {
        // Handle error if fullscreen is not supported
        console.warn('Fullscreen not supported');
      });
    } else {
      document.exitFullscreen().catch(() => {
        // Handle error if fullscreen is not supported
        console.warn('Fullscreen not supported');
      });
    }
  };

  const value = {
    viewMode,
    isEmbedded: viewMode === 'embedded',
    isFullscreen: viewMode === 'fullscreen',
    isStandalone: viewMode === 'standalone',
    setIsFullscreen,
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