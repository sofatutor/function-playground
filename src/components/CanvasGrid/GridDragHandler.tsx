import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Point } from '@/types/shapes';
import { snapToGrid, getGridModifiers } from '@/utils/grid/gridUtils';

interface GridDragHandlerProps {
  origin: Point;
  onOriginChange: (newOrigin: Point) => void;
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

  // Replace the existing snapToGrid function with our new utility
  const handleSnapToGrid = useCallback((point: Point): Point => {
    if (!pixelsPerSmallUnit || pixelsPerSmallUnit <= 0) {
      return point;
    }
    
    // Use the utility with minimal parameters since we only need simple snapping here
    return snapToGrid(
      point,
      null, // No grid origin offset needed here
      true, // Always use small units
      'cm', // Default unit (doesn't matter since we're using small units)
      0,    // Not needed
      pixelsPerSmallUnit // Pass the small unit size
    );
  }, [pixelsPerSmallUnit]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Middle mouse button (button === 1) or left mouse button with Alt key (button === 0 && e.altKey)
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      e.stopPropagation();
      
      console.log('GridDragHandler: Mouse down, starting drag');
      setIsDragging(true);
      
      // Set isMovingAll if Shift key is pressed
      const shiftPressed = e.shiftKey;
      console.log('GridDragHandler: Shift key pressed:', shiftPressed);
      setIsMovingAll(shiftPressed);
      
      setDragStart({ x: e.clientX, y: e.clientY });
      // Use the current origin from the ref to avoid stale closures
      setOriginalOrigin({ ...originRef.current });
      setVirtualOrigin({ ...originRef.current });
      setLastDelta({ dx: 0, dy: 0 });
      
      document.body.classList.add('grid-dragging');
      
      if (shiftPressed) {
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
      
      // Skip tiny movements to prevent jitter
      if (Math.abs(currentDx - lastDelta.dx) < 1 && Math.abs(currentDy - lastDelta.dy) < 1) {
        return;
      }
      
      // Calculate the change in delta since last update
      const deltaDx = currentDx - lastDelta.dx;
      const deltaDy = currentDy - lastDelta.dy;
      
      // Update the virtual origin with the precise current position
      const newVirtualOrigin = {
        x: originalOrigin.x + currentDx,
        y: originalOrigin.y + currentDy
      };
      
      setVirtualOrigin(newVirtualOrigin);
      
      // Check if Shift key is pressed using our utility
      const { shiftPressed } = getGridModifiers(e);
      
      // If we're moving all shapes (Shift key is pressed)
      if ((isMovingAll || shiftPressed) && onMoveAllShapes && (deltaDx !== 0 || deltaDy !== 0)) {
        console.log('GridDragHandler: Moving all shapes by', deltaDx, deltaDy);
        // Normal behavior - move shapes by the raw delta
        onMoveAllShapes(deltaDx, deltaDy);
      }
      
      // Update the grid origin
      console.log('GridDragHandler: Updating origin to', newVirtualOrigin);
      onOriginChange(newVirtualOrigin);
      
      // Update the last delta
      setLastDelta({ dx: currentDx, dy: currentDy });

      // Add detailed logging in handleMouseMove
      console.log('GridDragHandler: Mouse move, currentDx:', currentDx, 'currentDy:', currentDy);
      console.log('GridDragHandler: Mouse move, deltaDx:', deltaDx, 'deltaDy:', deltaDy);
      console.log('GridDragHandler: Mouse move, newVirtualOrigin:', newVirtualOrigin);
    }
  }, [isDragging, isMovingAll, dragStart, originalOrigin, lastDelta, onOriginChange, onMoveAllShapes]);

  // Debounce the onOriginChange function
  const handleMouseUp = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (isDragging) {
      if ('preventDefault' in e) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      console.log('GridDragHandler: Mouse up, ending drag');
      
      // Calculate final position
      const finalPosition = {
        x: originalOrigin.x + (e.clientX - dragStart.x),
        y: originalOrigin.y + (e.clientY - dragStart.y)
      };
      
      // Make sure we update with the final position
      console.log('GridDragHandler: Mouse up, applying finalPosition:', finalPosition);
      
      // Only update if there's an actual change to prevent unnecessary re-renders
      const dx = finalPosition.x - originalOrigin.x;
      const dy = finalPosition.y - originalOrigin.y;
      
      // Use a more significant threshold to prevent small movements from triggering updates
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        // Create a new object to ensure React detects the change
        const newPosition = { 
          x: finalPosition.x, 
          y: finalPosition.y 
        };
        
        // Call the callback with the new position
        onOriginChange(newPosition);
      } else {
        console.log('GridDragHandler: Skipping small movement on mouse up, dx:', dx, 'dy:', dy);
      }
      
      // Reset state
      setIsDragging(false);
      setIsMovingAll(false);
      setLastDelta({ dx: 0, dy: 0 });
      
      document.body.classList.remove('grid-dragging');
      document.body.classList.remove('moving-all');
      
      console.log('GridDragHandler: Drag ended, isMovingAll reset to false');

      // Add detailed logging in handleMouseUp
      console.log('GridDragHandler: Mouse up, finalPosition:', finalPosition);
    }
  }, [isDragging, dragStart, originalOrigin, onOriginChange]);
  
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