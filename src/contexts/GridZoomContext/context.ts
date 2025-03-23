import { createContext } from 'react';

export interface GridZoomContextType {
  zoomFactor: number;
  zoomIn: () => void;
  zoomOut: () => void;
  setZoomFactor: (factor: number) => void;
}

export const GridZoomContext = createContext<GridZoomContextType | undefined>(undefined); 