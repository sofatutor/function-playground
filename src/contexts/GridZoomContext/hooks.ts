import { useContext } from 'react';
import { GridZoomContext } from './context';

export const useGridZoom = () => {
  const context = useContext(GridZoomContext);
  
  if (context === undefined) {
    throw new Error('useGridZoom must be used within a GridZoomProvider');
  }
  
  return context;
}; 