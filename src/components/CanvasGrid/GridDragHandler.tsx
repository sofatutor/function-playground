import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Point } from '@/types/shapes';
import { snapToGrid, getGridModifiers } from '@/utils/grid/gridUtils';

// DragStateHandler class for better drag state management
export type DragStateListener = (isDragging: boolean) => void;

export class DragStateHandler {
  private _value: boolean = false;
  private listeners: Set<DragStateListener> = new Set();

  get value(): boolean {
    return this._value;
  }

  set value(newValue: boolean) {
    if (this._value !== newValue) {
      this._value = newValue;
      this.notifyListeners();
    }
  }

  subscribe(listener: DragStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this._value));
  }
}

// Create an instance of the drag state handler
export const isGridDragging = new DragStateHandler();

interface GridDragHandlerProps {
  origin: Point;
  onOriginChange: (newOrigin: Point) => void;
  onMoveAllShapes?: (dx: number, dy: number) => void;
  pixelsPerSmallUnit?: number;
  children: React.ReactNode;
}

export const GridDragHandler: React.FC<GridDragHandlerProps> = ({ 
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

  // Update the isDragging effect to remove unnecessary logging
  useEffect(() => {
    isDraggingRef.current = isDragging;
    isGridDragging.value = isDragging;
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

  // Update handleMouseDown to remove unnecessary logging
  const handleMouseDown = useCallback((e: React.MouseEvent | MouseEvent) => {
    const isMiddleButton = 'button' in e ? e.button === 1 : false;
    const isLeftButtonWithAlt = 'button' in e ? (e.button === 0 && e.altKey) : false;
    
    if (isMiddleButton || isLeftButtonWithAlt) {
      e.preventDefault();
      if ('stopPropagation' in e) {
        e.stopPropagation();
      }
      
      const { shiftPressed } = getGridModifiers(e);
      
      setIsDragging(true);
      setIsMovingAll(shiftPressed);
      isDraggingRef.current = true;
      isGridDragging.value = true;
      
      setDragStart({
        x: 'clientX' in e ? e.clientX : 0,
        y: 'clientY' in e ? e.clientY : 0
      });
      
      setOriginalOrigin({ ...origin });
      setLastDelta({ dx: 0, dy: 0 });
      
      document.body.classList.add('grid-dragging');
      if (shiftPressed) {
        document.body.classList.add('moving-all');
      }
    }
  }, [origin]);

  // Update handleMouseMove to remove unnecessary logging
  const handleMouseMove = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      if ('stopPropagation' in e) {
        e.stopPropagation();
      }
      
      const clientX = 'clientX' in e ? e.clientX : 0;
      const clientY = 'clientY' in e ? e.clientY : 0;
      
      const currentDx = clientX - dragStart.x;
      const currentDy = clientY - dragStart.y;
      
      if (Math.abs(currentDx - lastDelta.dx) < 0.5 && Math.abs(currentDy - lastDelta.dy) < 0.5) {
        return;
      }
      
      const deltaDx = currentDx - lastDelta.dx;
      const deltaDy = currentDy - lastDelta.dy;
      
      const newVirtualOrigin = {
        x: originalOrigin.x + currentDx,
        y: originalOrigin.y + currentDy
      };
      
      setVirtualOrigin(newVirtualOrigin);
      
      const { shiftPressed } = getGridModifiers(e);
      
      if ((isMovingAll || shiftPressed) && onMoveAllShapes && (deltaDx !== 0 || deltaDy !== 0)) {
        onMoveAllShapes(deltaDx, deltaDy);
      }
      
      onOriginChange(newVirtualOrigin);
      setLastDelta({ dx: currentDx, dy: currentDy });
    }
  }, [isDragging, isMovingAll, dragStart, originalOrigin, lastDelta, onOriginChange, onMoveAllShapes]);

  // Update handleMouseUp to remove unnecessary logging
  const handleMouseUp = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (isDragging) {
      if ('preventDefault' in e) {
        e.preventDefault();
        if ('stopPropagation' in e) {
          e.stopPropagation();
        }
      }
      
      const finalPosition = {
        x: originalOrigin.x + (('clientX' in e ? e.clientX : 0) - dragStart.x),
        y: originalOrigin.y + (('clientY' in e ? e.clientY : 0) - dragStart.y)
      };
      
      const dx = finalPosition.x - originalOrigin.x;
      const dy = finalPosition.y - originalOrigin.y;
      
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        const newPosition = { 
          x: finalPosition.x, 
          y: finalPosition.y 
        };
        onOriginChange(newPosition);
      }
      
      setIsDragging(false);
      isDraggingRef.current = false;
      isGridDragging.value = false;
      setIsMovingAll(false);
      setLastDelta({ dx: 0, dy: 0 });
      
      document.body.classList.remove('grid-dragging');
      document.body.classList.remove('moving-all');
    }
  }, [isDragging, dragStart, originalOrigin, onOriginChange]);
  
  // Update useEffect to remove unnecessary logging
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