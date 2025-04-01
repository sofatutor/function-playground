import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { GridZoomContext, GridZoomContextType } from './context';

const MIN_ZOOM = 0.3;
const MAX_ZOOM = 3.0;
const STORAGE_KEY = 'gridZoomFactor';

interface GridZoomProviderProps {
  children: ReactNode;
}

export const GridZoomProvider: React.FC<GridZoomProviderProps> = ({ children }) => {
  // Load initial zoom from localStorage or use default
  const loadInitialZoom = (): number => {
    const savedZoom = localStorage.getItem(STORAGE_KEY);
    if (savedZoom) {
      const parsedZoom = parseFloat(savedZoom);
      return isNaN(parsedZoom) ? 1 : clampZoomFactor(parsedZoom);
    }
    return 1;
  };

  const clampZoomFactor = (factor: number): number => {
    return Math.min(Math.max(factor, MIN_ZOOM), MAX_ZOOM);
  };

  const [zoomFactor, setZoomFactorState] = useState(loadInitialZoom);

  const setZoomFactor = useCallback((factor: number) => {
    const clampedFactor = clampZoomFactor(factor);
    setZoomFactorState(clampedFactor);
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, clampedFactor.toString());
  }, []);

  const zoomIn = useCallback(() => {
    setZoomFactor(zoomFactor * 1.05);
  }, [zoomFactor, setZoomFactor]);

  const zoomOut = useCallback(() => {
    setZoomFactor(zoomFactor * 0.95);
  }, [zoomFactor, setZoomFactor]);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '+' || e.key === '=' || e.key === 'ArrowUp') {
          e.preventDefault();
          zoomIn();
        } else if (e.key === '-' || e.key === 'ArrowDown') {
          e.preventDefault();
          zoomOut();
        } else if (e.key === '0') {
          e.preventDefault();
          setZoomFactor(1);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoomIn, zoomOut, setZoomFactor]);

  const contextValue: GridZoomContextType = {
    zoomFactor,
    zoomIn,
    zoomOut,
    setZoomFactor,
  };

  return (
    <GridZoomContext.Provider value={contextValue}>
      {children}
    </GridZoomContext.Provider>
  );
}; 