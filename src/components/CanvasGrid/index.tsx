import React, { useState, useEffect, useRef } from 'react';
import { MeasurementUnit, Point } from '@/types/shapes';
import GridLines from './GridLines';
import OriginIndicator from './OriginIndicator';
import { GridDragHandler } from './GridDragHandler';
import GridZoomControl from './GridZoomControl';
import { useGridZoom } from '@/contexts/GridZoomContext/index';

// Remove global flag as we'll handle initialization differently
// const HAS_COMPLETED_FIRST_RENDER = { value: false };

interface CanvasGridProps {
  canvasSize: { width: number, height: number };
  pixelsPerCm: number;
  pixelsPerMm: number;
  measurementUnit?: MeasurementUnit;
  onMoveAllShapes?: (dx: number, dy: number) => void;
  initialPosition?: Point | null;
  onPositionChange?: (position: Point) => void;
}

const CanvasGrid: React.FC<CanvasGridProps> = ({
  canvasSize,
  pixelsPerCm,
  pixelsPerMm,
  measurementUnit = 'cm',
  onMoveAllShapes,
  initialPosition,
  onPositionChange
}) => {
  const { zoomFactor } = useGridZoom();
  const hasInitialized = useRef(false);
  const hasOriginMoved = useRef(false);
  const isHandlingExternalUpdate = useRef(false);
  const [origin, setOrigin] = useState<Point>({ x: 0, y: 0 });
  const prevCanvasSizeRef = useRef({ width: 0, height: 0 });

  // Initialize the grid position once
  useEffect(() => {
    if (hasInitialized.current) return;
    
    if (initialPosition) {
      setOrigin(initialPosition);
    } else if (canvasSize.width > 0 && canvasSize.height > 0) {
      const centerPoint = {
        x: Math.round(canvasSize.width / 2), 
        y: Math.round(canvasSize.height / 2) 
      };
      setOrigin(centerPoint);
    }
    
    hasInitialized.current = true;
  }, [initialPosition, canvasSize]);

  // Update grid position when initialPosition changes
  useEffect(() => {
    if (!hasInitialized.current) return;
    
    if (!initialPosition) {
      if (canvasSize.width > 0 && canvasSize.height > 0) {
        const centerPoint = {
          x: Math.round(canvasSize.width / 2), 
          y: Math.round(canvasSize.height / 2) 
        };
        
        isHandlingExternalUpdate.current = true;
        setOrigin(centerPoint);
        hasOriginMoved.current = false;
        
        setTimeout(() => {
          isHandlingExternalUpdate.current = false;
        }, 50);
      }
      return;
    }
    
    if (hasOriginMoved.current) return;
    
    isHandlingExternalUpdate.current = true;
    setOrigin(initialPosition);
    
    setTimeout(() => {
      isHandlingExternalUpdate.current = false;
    }, 50);
  }, [initialPosition, canvasSize]);

  // Handle canvas size changes
  useEffect(() => {
    const prevSize = prevCanvasSizeRef.current;
    const currentSize = canvasSize;
    
    prevCanvasSizeRef.current = { ...currentSize };
    
    const hasSignificantChange = 
      (Math.abs(prevSize.width - currentSize.width) > 50 || 
       Math.abs(prevSize.height - currentSize.height) > 50) &&
      currentSize.width > 0 && currentSize.height > 0;
    
    const isFirstMeaningfulSize = 
      (prevSize.width === 0 || prevSize.height === 0) && 
      currentSize.width > 0 && currentSize.height > 0;
    
    if (hasSignificantChange || isFirstMeaningfulSize) {
      if (!hasOriginMoved.current) {
        const newOrigin = {
          x: Math.floor(currentSize.width / 2),
          y: Math.floor(currentSize.height / 2)
        };
        
        setOrigin(newOrigin);
        
        if (onPositionChange) {
          onPositionChange(newOrigin);
        }
      }
    }
  }, [canvasSize, onPositionChange]);

  return (
    <div 
      className="canvas-grid" 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none',
        zIndex: 5
      }}
    >
      <GridDragHandler
        origin={origin}
        onOriginChange={(newOrigin) => {
          if (isHandlingExternalUpdate.current) return;
          
          hasOriginMoved.current = true;
          setOrigin(newOrigin);
          
          if (onPositionChange) {
            onPositionChange(newOrigin);
          }
        }}
        onMoveAllShapes={onMoveAllShapes}
        pixelsPerSmallUnit={pixelsPerMm}
      >
        <GridLines
          canvasSize={canvasSize}
          pixelsPerCm={pixelsPerCm}
          pixelsPerMm={pixelsPerMm}
          measurementUnit={measurementUnit}
          origin={origin}
        />
        <OriginIndicator
          origin={origin}
          canvasSize={canvasSize}
        />
      </GridDragHandler>
      <div style={{ position: 'relative', zIndex: 50 }}>
        <GridZoomControl />
      </div>
    </div>
  );
};

export default CanvasGrid; 