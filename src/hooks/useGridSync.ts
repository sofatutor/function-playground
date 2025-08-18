import { useCallback, useEffect, useRef, useState } from 'react';
import { Point } from '@/types/shapes';
import { isGridDragging } from '@/components/CanvasGrid/GridDragHandler';
import { GRID_POSITION_DEBOUNCE_MS, POSITION_COMPARISON_THRESHOLD } from '@/utils/constants';
import { logger } from '@/utils/logging';

interface UseGridSyncOptions {
  onGridPositionChange?: (position: Point) => void;
  externalGridPosition?: Point | null;
}

/**
 * Hook for managing external ↔ internal grid sync with drag guards
 */
export const useGridSync = ({ onGridPositionChange, externalGridPosition }: UseGridSyncOptions) => {
  const [gridPosition, setGridPosition] = useState<Point | null>(null);
  const gridPositionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle internal grid position changes with debouncing
  const handleGridPositionChange = useCallback((newPosition: Point) => {
    logger.debug('GeometryCanvas: Grid position changed:', newPosition);
    
    // Only update if the position has actually changed
    if (!gridPosition || newPosition.x !== gridPosition.x || newPosition.y !== gridPosition.y) {
      // Debounce the grid position updates for parent notification, but update local state immediately
      if (gridPositionTimeoutRef.current) {
        clearTimeout(gridPositionTimeoutRef.current);
      }
      
      // Update the grid position immediately to ensure formulas update in real-time
      setGridPosition(newPosition);
      
      // Notify parent after a delay to prevent too many updates
      gridPositionTimeoutRef.current = setTimeout(() => {
        // If we have a parent handler for grid position changes, call it
        if (onGridPositionChange) {
          logger.debug('GeometryCanvas: Notifying parent of grid position change (debounced)');
          onGridPositionChange(newPosition);
        }
        gridPositionTimeoutRef.current = null;
      }, GRID_POSITION_DEBOUNCE_MS);
    } else {
      logger.debug('GeometryCanvas: Skipping grid position update (no change)');
    }
  }, [onGridPositionChange, gridPosition]);

  // Handle external grid position changes with drag guards
  useEffect(() => {
    // Ignore external updates while user is actively dragging to avoid jump-backs
    if (isGridDragging.value) {
      return;
    }
    logger.debug('GeometryCanvas: External grid position changed:', externalGridPosition);
    
    // Skip if the positions are the same (using more precise comparison)
    if (gridPosition && externalGridPosition &&
        Math.abs(gridPosition.x - externalGridPosition.x) < POSITION_COMPARISON_THRESHOLD &&
        Math.abs(gridPosition.y - externalGridPosition.y) < POSITION_COMPARISON_THRESHOLD) {
      return;
    }
    
    // If externalGridPosition is null, reset internal grid position to null
    if (externalGridPosition === null) {
      logger.debug('GeometryCanvas: Resetting internal grid position to null');
      setGridPosition(null);
      return;
    }
    
    if (externalGridPosition) {
      logger.debug('GeometryCanvas: Updating internal grid position from external');
      setGridPosition(externalGridPosition);
    }
  }, [externalGridPosition, gridPosition]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (gridPositionTimeoutRef.current) {
        clearTimeout(gridPositionTimeoutRef.current);
      }
    };
  }, []);

  return {
    gridPosition,
    setGridPosition,
    handleGridPositionChange,
  };
};