import React, { useState, useCallback, useEffect } from 'react';

interface GridDragHandlerProps {
  origin: { x: number, y: number };
  onOriginChange: (newOrigin: { x: number, y: number }) => void;
  onMoveAllShapes?: (dx: number, dy: number) => void;
  children: React.ReactNode;
}

const GridDragHandler: React.FC<GridDragHandlerProps> = ({ 
  origin, 
  onOriginChange,
  onMoveAllShapes,
  children 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isMovingAll, setIsMovingAll] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalOrigin, setOriginalOrigin] = useState({ x: 0, y: 0 });
  const [lastDelta, setLastDelta] = useState({ dx: 0, dy: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      
      setIsMovingAll(e.shiftKey && e.button === 0);
      
      setDragStart({ x: e.clientX, y: e.clientY });
      setOriginalOrigin({ ...origin });
      setLastDelta({ dx: 0, dy: 0 });
      
      document.body.classList.add('grid-dragging');
      
      if (e.shiftKey && e.button === 0) {
        document.body.classList.add('moving-all');
      }
    }
  }, [origin]);

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
      
      // Update the origin with the precise current position
      const newOrigin = {
        x: originalOrigin.x + currentDx,
        y: originalOrigin.y + currentDy
      };
      
      onOriginChange(newOrigin);
      
      // Only move shapes if there's an actual change in position
      if (isMovingAll && onMoveAllShapes && (deltaDx !== 0 || deltaDy !== 0)) {
        // Apply the delta change to shapes
        onMoveAllShapes(deltaDx, deltaDy);
        
        // Update the last delta
        setLastDelta({ dx: currentDx, dy: currentDy });
      }
    }
  }, [isDragging, isMovingAll, dragStart, originalOrigin, lastDelta, onOriginChange, onMoveAllShapes]);

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