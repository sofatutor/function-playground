import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Point } from '@/types/shapes';
import { snapToGrid, getGridModifiers } from '@/utils/grid/gridUtils';

// Add a global flag to track if grid dragging is in progress
// This can be used by other components to optimize rendering during dragging
export const isGridDragging = { value: false };

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
  const isDraggingRef = useRef(false);
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

  // Update the isDraggingRef when isDragging changes
  useEffect(() => {
    isDraggingRef.current = isDragging;
    
    // Also update the global flag
    isGridDragging.value = isDragging;
    console.log('GridDragHandler: Updated isGridDragging.value to', isDragging);
  }, [isDragging]);

  // Replace the existing snapToGrid function with our new utility
  const handleSnapToGrid = useCallback((point: Point): Point => {
    if (!pixelsPerSmallUnit || pixelsPerSmallUnit <= 0) {
      return point;
    }
    
    // Use the utility with the correct grid origin
    return snapToGrid(
      point,
      origin, // Pass the actual grid origin
      true, // Always use small units
      'cm', // Default unit (doesn't matter since we're using small units)
      0,    // Not needed
      pixelsPerSmallUnit // Pass the small unit size
    );
  }, [pixelsPerSmallUnit, origin]);

  const handleMouseDown = useCallback((e: React.MouseEvent | MouseEvent) => {
    // Only start dragging on middle mouse button or left mouse button with Alt key
    const isMiddleButton = 'button' in e ? e.button === 1 : false;
    const isLeftButtonWithAlt = 'button' in e ? (e.button === 0 && e.altKey) : false;
    
    if (isMiddleButton || isLeftButtonWithAlt) {
      e.preventDefault();
      if ('stopPropagation' in e) {
        e.stopPropagation();
      }
      
      console.log('GridDragHandler: Mouse down, starting drag');
      
      // Explicitly set the global dragging flag
      isGridDragging.value = true;
      console.log('GridDragHandler: Set isGridDragging.value to true');
      
      // Check if Shift key is pressed using our utility
      const { shiftPressed } = getGridModifiers(e);
      
      // Set dragging state
      setIsDragging(true);
      setIsMovingAll(shiftPressed);
      isDraggingRef.current = true;
      
      // Store the starting point
      setDragStart({
        x: 'clientX' in e ? e.clientX : 0,
        y: 'clientY' in e ? e.clientY : 0
      });
      
      // Store the original origin
      setOriginalOrigin({ ...origin });
      
      // Reset the last delta
      setLastDelta({ dx: 0, dy: 0 });
      
      // Add classes to body for global styling
      document.body.classList.add('grid-dragging');
      if (shiftPressed) {
        document.body.classList.add('moving-all');
      }
      
      console.log('GridDragHandler: Drag started, isMovingAll set to', shiftPressed);
    }
  }, [origin]);

  const handleMouseMove = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      if ('stopPropagation' in e) {
        e.stopPropagation();
      }
      
      // Safely access clientX and clientY
      const clientX = 'clientX' in e ? e.clientX : 0;
      const clientY = 'clientY' in e ? e.clientY : 0;
      
      // Calculate precise deltas
      const currentDx = clientX - dragStart.x;
      const currentDy = clientY - dragStart.y;
      
      // Skip tiny movements to prevent jitter - use a smaller threshold for more responsive updates
      if (Math.abs(currentDx - lastDelta.dx) < 0.5 && Math.abs(currentDy - lastDelta.dy) < 0.5) {
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
      
      // Update the grid origin immediately on every mouse move to ensure formulas update in real-time
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
        if ('stopPropagation' in e) {
          e.stopPropagation();
        }
      }
      
      console.log('GridDragHandler: Mouse up, ending drag');
      
      // Explicitly reset the global dragging flag
      isGridDragging.value = false;
      console.log('GridDragHandler: Set isGridDragging.value to false');
      
      // Calculate final position
      const finalPosition = {
        x: originalOrigin.x + (('clientX' in e ? e.clientX : 0) - dragStart.x),
        y: originalOrigin.y + (('clientY' in e ? e.clientY : 0) - dragStart.y)
      };
      
      // Make sure we update with the final position
      console.log('GridDragHandler: Mouse up, applying finalPosition:', finalPosition);
      
      // Only update if there's an actual change to prevent unnecessary re-renders
      const dx = finalPosition.x - originalOrigin.x;
      const dy = finalPosition.y - originalOrigin.y;
      
      // Use a smaller threshold to allow more responsive updates
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
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
      isDraggingRef.current = false;
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
      console.log('GridDragHandler: Adding global mouse event listeners');
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      // Only remove event listeners, don't reset dragging state in cleanup
      // This prevents the dragging state from being reset during active dragging
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      
      // Only remove classes if we're actually cleaning up (not during a drag operation)
      if (!isDragging) {
        document.body.classList.remove('grid-dragging');
        document.body.classList.remove('moving-all');
      }
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <svg
      width="100%"
      height="100%"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
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