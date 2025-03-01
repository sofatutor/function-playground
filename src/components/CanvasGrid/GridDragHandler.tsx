import React, { useState, useCallback, useEffect } from 'react';

interface GridDragHandlerProps {
  origin: { x: number, y: number };
  onOriginChange: (newOrigin: { x: number, y: number }) => void;
  children: React.ReactNode;
}

const GridDragHandler: React.FC<GridDragHandlerProps> = ({ 
  origin, 
  onOriginChange, 
  children 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [originalOrigin, setOriginalOrigin] = useState({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Only handle middle mouse button (button 1) or Alt+left click for grid dragging
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      e.stopPropagation(); // Prevent event from bubbling to shapes
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setOriginalOrigin({ ...origin });
    }
  }, [origin]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation(); // Prevent event from bubbling to shapes
      const dx = e.clientX - dragStart.x;
      const dy = e.clientY - dragStart.y;
      onOriginChange({
        x: originalOrigin.x + dx,
        y: originalOrigin.y + dy
      });
    }
  }, [isDragging, dragStart, originalOrigin, onOriginChange]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation(); // Prevent event from bubbling to shapes
      setIsDragging(false);
    }
  }, [isDragging]);
  
  // Add global mouse up handler to ensure we stop dragging even if mouse is released outside the component
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
    };
    
    if (isDragging) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
    }
    
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  return (
    <svg
      width="100%"
      height="100%"
      onMouseDown={handleMouseDown}
      onMouseMove={isDragging ? handleMouseMove : undefined}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ 
        cursor: isDragging ? 'grabbing' : 'default',
        pointerEvents: 'auto',
        zIndex: 0
      }}
    >
      {children}
    </svg>
  );
};

export default GridDragHandler; 