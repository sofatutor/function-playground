import React, { useState, useCallback, useEffect, useRef } from 'react';

interface GridDragHandlerProps {
  origin: { x: number, y: number };
  onOriginChange: (newOrigin: { x: number, y: number }) => void;
  onMoveAllShapes?: (dx: number, dy: number) => void;
  pixelsPerSmallUnit?: number;
  children: React.ReactNode;
}

const GridDragHandler: React.FC<GridDragHandlerProps> = ({ 
  origin, 
  onOriginChange,
  onMoveAllShapes,
  pixelsPerSmallUnit,
  children 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isMovingAll, setIsMovingAll] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalOrigin, setOriginalOrigin] = useState({ x: 0, y: 0 });
  const [lastDelta, setLastDelta] = useState({ dx: 0, dy: 0 });
  const [virtualOrigin, setVirtualOrigin] = useState({ x: 0, y: 0 });
  
  // Keep a ref to the current origin to avoid stale closures in event handlers
  const originRef = useRef(origin);
  
  // Update the ref when the origin changes
  useEffect(() => {
    originRef.current = origin;
  }, [origin]);

  // Helper function to snap a point to the grid
  const snapToGrid = useCallback((point: { x: number, y: number }): { x: number, y: number } => {
    if (!pixelsPerSmallUnit || pixelsPerSmallUnit <= 0) {
      return point;
    }
    
    return {
      x: Math.floor(point.x / pixelsPerSmallUnit) * pixelsPerSmallUnit,
      y: Math.floor(point.y / pixelsPerSmallUnit) * pixelsPerSmallUnit
    };
  }, [pixelsPerSmallUnit]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      
      // Set isMovingAll if Shift key is pressed
      setIsMovingAll(e.shiftKey);
      
      setDragStart({ x: e.clientX, y: e.clientY });
      // Use the current origin from the ref to avoid stale closures
      setOriginalOrigin({ ...originRef.current });
      setVirtualOrigin({ ...originRef.current });
      setLastDelta({ dx: 0, dy: 0 });
      
      document.body.classList.add('grid-dragging');
      
      if (e.shiftKey) {
        document.body.classList.add('moving-all');
      }
    }
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      if ('stopPropagation' in e) {
        e.stopPropagation();
      }
      
      // Calculate precise deltas
      const currentDx = e.clientX - dragStart.x;
      const currentDy = e.clientY - dragStart.y;
      
      // Calculate the change in delta since last update
      const deltaDx = currentDx - lastDelta.dx;
      const deltaDy = currentDy - lastDelta.dy;
      
      // Update the virtual origin with the precise current position
      const newVirtualOrigin = {
        x: originalOrigin.x + currentDx,
        y: originalOrigin.y + currentDy
      };
      
      setVirtualOrigin(newVirtualOrigin);
      
      // Determine if we should snap to grid (Alt key)
      const shouldSnap = 'altKey' in e ? e.altKey : false;
      
      // Apply snapping if Alt key is pressed, otherwise use the virtual origin directly
      const newOrigin = shouldSnap && pixelsPerSmallUnit 
        ? snapToGrid(newVirtualOrigin)
        : newVirtualOrigin;
      
      // If we're moving all shapes (Shift key is pressed)
      if (isMovingAll && onMoveAllShapes && (deltaDx !== 0 || deltaDy !== 0)) {
        // If Alt key is also pressed, we need to ensure shapes move consistently with the grid
        if (shouldSnap && pixelsPerSmallUnit) {
          // Calculate the snapped delta to ensure shapes move by the same amount as the grid
          const snappedDelta = {
            dx: newOrigin.x - originRef.current.x,
            dy: newOrigin.y - originRef.current.y
          };
          
          // Move shapes by the snapped delta
          if (snappedDelta.dx !== 0 || snappedDelta.dy !== 0) {
            onMoveAllShapes(snappedDelta.dx, snappedDelta.dy);
          }
        } else {
          // Normal behavior - move shapes by the raw delta
          onMoveAllShapes(deltaDx, deltaDy);
        }
      }
      
      // Update the grid origin
      onOriginChange(newOrigin);
      
      // Update the last delta
      setLastDelta({ dx: currentDx, dy: currentDy });
    }
  }, [isDragging, isMovingAll, dragStart, originalOrigin, lastDelta, onOriginChange, onMoveAllShapes, pixelsPerSmallUnit, snapToGrid]);

  const handleMouseUp = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (isDragging) {
      if ('preventDefault' in e) {
        e.preventDefault();
        e.stopPropagation();
      }
      setIsDragging(false);
      setIsMovingAll(false);
      setLastDelta({ dx: 0, dy: 0 });
      
      document.body.classList.remove('grid-dragging');
      document.body.classList.remove('moving-all');
    }
  }, [isDragging]);
  
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleMouseMove(e);
    };
    
    const handleGlobalMouseUp = (e: MouseEvent) => {
      handleMouseUp(e);
    };
    
    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      document.body.classList.remove('grid-dragging');
      document.body.classList.remove('moving-all');
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <svg
      width="100%"
      height="100%"
      onMouseDown={handleMouseDown}
      style={{ 
        cursor: isDragging ? (isMovingAll ? 'move' : 'grabbing') : 'default',
        pointerEvents: 'auto',
        zIndex: 10,
        position: 'relative'
      }}
    >
      {children}
    </svg>
  );
};

export default GridDragHandler; 