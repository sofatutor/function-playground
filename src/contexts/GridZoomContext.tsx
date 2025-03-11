import React, { createContext, useContext, useEffect, useState } from 'react';

interface GridZoomContextType {
  zoomFactor: number;
  zoomIn: () => void;
  zoomOut: () => void;
  setZoomFactor: (factor: number) => void;
}

const GridZoomContext = createContext<GridZoomContextType | undefined>(undefined);

const MIN_ZOOM = 0.3; // 30%
const MAX_ZOOM = 3.0; // 300%
const ZOOM_STEP = 0.05; // 5% steps
const STORAGE_KEY = 'gridZoomFactor';

export const GridZoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize zoom factor from localStorage or default to 1
  const [zoomFactor, setZoomFactorState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = parseFloat(stored);
      return parsed >= MIN_ZOOM && parsed <= MAX_ZOOM ? parsed : 1;
    }
    return 1;
  });

  // Clamp zoom factor between min and max values
  const clampZoomFactor = (factor: number): number => {
    return Math.min(Math.max(factor, MIN_ZOOM), MAX_ZOOM);
  };

  // Update zoom factor and persist to localStorage
  const setZoomFactor = (factor: number) => {
    const clampedFactor = clampZoomFactor(factor);
    setZoomFactorState(clampedFactor);
    localStorage.setItem(STORAGE_KEY, clampedFactor.toString());
  };

  const zoomIn = () => setZoomFactor(zoomFactor + ZOOM_STEP);
  const zoomOut = () => setZoomFactor(zoomFactor - ZOOM_STEP);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey) {
        if (event.key === '+' || event.key === '=') {
          event.preventDefault();
          zoomIn();
        } else if (event.key === '-' || event.key === '_') {
          event.preventDefault();
          zoomOut();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomFactor]); // Include zoomFactor in dependencies for updated zoom calculations

  const value = {
    zoomFactor,
    zoomIn,
    zoomOut,
    setZoomFactor,
  };

  return (
    <GridZoomContext.Provider value={value}>
      {children}
    </GridZoomContext.Provider>
  );
};

export const useGridZoom = () => {
  const context = useContext(GridZoomContext);
  if (context === undefined) {
    throw new Error('useGridZoom must be used within a GridZoomProvider');
  }
  return context;
}; 