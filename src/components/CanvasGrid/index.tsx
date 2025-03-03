import React, { useState, useEffect, useRef } from 'react';
import { MeasurementUnit, Point } from '@/types/shapes';
import GridLines from './GridLines';
import OriginIndicator from './OriginIndicator';
import GridDragHandler from './GridDragHandler';

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
  // State for the grid origin point - always center the grid on initial load
  const [origin, setOrigin] = useState<Point>({
    x: canvasSize.width / 2,
    y: canvasSize.height / 2
  });
  
  // Store the previous measurement unit and pixel ratio to handle unit changes
  const [prevUnit, setPrevUnit] = useState<MeasurementUnit>(measurementUnit);
  const [prevPixelsPerCm, setPrevPixelsPerCm] = useState<number>(pixelsPerCm);
  
  // Track if this is the initial render
  const isInitialRender = useRef(true);
  // Track if origin has been manually moved
  const hasOriginMoved = useRef(false);

  // Update origin when canvas size changes, but only on initial render or if origin hasn't been moved
  useEffect(() => {
    // Always center the grid on initial render or when canvas size changes
    if (isInitialRender.current || canvasSize.width === 0 || canvasSize.height === 0) {
      if (canvasSize.width > 0 && canvasSize.height > 0) {
        setOrigin({
          x: canvasSize.width / 2,
          y: canvasSize.height / 2
        });
        
        // If we have an initialPosition from a previous session, notify the parent
        // but still start with the grid centered
        if (onPositionChange) {
          onPositionChange({
            x: canvasSize.width / 2,
            y: canvasSize.height / 2
          });
        }
        
        isInitialRender.current = false;
      }
    } else if (!hasOriginMoved.current) {
      // Only update if the origin is at the default center position and hasn't been manually moved
      if (
        Math.abs(origin.x - (canvasSize.width / 2)) < 2 && 
        Math.abs(origin.y - (canvasSize.height / 2)) < 2
      ) {
        setOrigin({
          x: canvasSize.width / 2,
          y: canvasSize.height / 2
        });
      }
    }
  }, [canvasSize, onPositionChange]);
  
  // Update origin when initialPosition changes, but only after initial render
  useEffect(() => {
    if (initialPosition && !isInitialRender.current) {
      // Only update if the position has actually changed and we're not in the initial render
      if (
        initialPosition.x !== origin.x ||
        initialPosition.y !== origin.y
      ) {
        setOrigin(initialPosition);
      }
    }
  }, [initialPosition, origin.x, origin.y]);
  
  // Custom origin change handler that also tracks if origin has been manually moved
  const handleOriginChange = (newOrigin: Point) => {
    hasOriginMoved.current = true;
    setOrigin(newOrigin);
    
    // Notify parent component of position change
    if (onPositionChange) {
      onPositionChange(newOrigin);
    }
  };
  
  // Handle measurement unit changes without moving the grid
  useEffect(() => {
    if (prevUnit !== measurementUnit) {
      // Keep the grid position stable when switching units
      // We don't need to adjust the origin position since we want the grid to stay in place
      
      // Update previous values
      setPrevUnit(measurementUnit);
      setPrevPixelsPerCm(pixelsPerCm);
    } else if (prevPixelsPerCm !== pixelsPerCm) {
      // If only the pixel ratio changed (e.g., due to calibration), update the reference
      setPrevPixelsPerCm(pixelsPerCm);
    }
  }, [measurementUnit, pixelsPerCm, prevUnit, prevPixelsPerCm]);

  return (
    <div 
      className="canvas-grid" 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none', // Allow events to pass through to shapes underneath by default
        zIndex: 5 // Ensure grid is above shapes when interacting with it
      }}
    >
      <GridDragHandler
        origin={origin}
        onOriginChange={handleOriginChange}
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
    </div>
  );
};

export default CanvasGrid; 