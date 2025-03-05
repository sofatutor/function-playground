import React, { useState, useEffect, useRef } from 'react';
import { MeasurementUnit, Point } from '@/types/shapes';
import GridLines from './GridLines';
import OriginIndicator from './OriginIndicator';
import GridDragHandler from './GridDragHandler';

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
  // Track if initialization has been done
  const hasInitialized = useRef(false);
  
  // Track if origin has been manually moved
  const hasOriginMoved = useRef(false);
  
  // Track if we're currently handling an external position update
  const isHandlingExternalUpdate = useRef(false);
  
  // State for the grid origin point
  const [origin, setOrigin] = useState<Point>({ x: 0, y: 0 });
  
  // Track previous canvas size to detect significant changes
  const prevCanvasSizeRef = useRef({ width: 0, height: 0 });
  
  // Initialize the grid position once
  useEffect(() => {
    // Skip if we've already initialized
    if (hasInitialized.current) return;
    
    console.log('CanvasGrid: Initializing grid position');
    
    // Set the initial position
    if (initialPosition) {
      console.log('CanvasGrid: Using initialPosition for origin:', initialPosition);
      setOrigin(initialPosition);
    } else if (canvasSize.width > 0 && canvasSize.height > 0) {
      const centerPoint = {
        x: Math.round(canvasSize.width / 2), 
        y: Math.round(canvasSize.height / 2) 
      };
      console.log('CanvasGrid: Using center for origin:', centerPoint);
      setOrigin(centerPoint);
    }
    
    // Mark as initialized
    hasInitialized.current = true;
  }, [initialPosition, canvasSize]);
  
  // Add an effect to update the grid position when initialPosition changes
  // This ensures the grid updates even after initialization
  useEffect(() => {
    // Skip during initialization phase
    if (!hasInitialized.current) return;
    
    // If initialPosition is null, reset to center
    if (!initialPosition) {
      console.log('CanvasGrid: Resetting grid to center because initialPosition is null');
      
      // Only reset if canvas size is valid
      if (canvasSize.width > 0 && canvasSize.height > 0) {
        const centerPoint = {
          x: Math.round(canvasSize.width / 2), 
          y: Math.round(canvasSize.height / 2) 
        };
        
        // Set the isHandlingExternalUpdate flag to prevent feedback loops
        isHandlingExternalUpdate.current = true;
        
        // Reset the origin to center
        setOrigin(centerPoint);
        
        // Reset the hasOriginMoved flag since we're explicitly resetting
        hasOriginMoved.current = false;
        
        // Reset the flag after a short delay
        setTimeout(() => {
          isHandlingExternalUpdate.current = false;
        }, 50);
      }
      
      return;
    }
    
    // Skip if the origin has been manually moved by the user
    if (hasOriginMoved.current) {
      console.log('CanvasGrid: Skipping initialPosition update because origin was manually moved');
      return;
    }
    
    console.log('CanvasGrid: Updating origin from initialPosition:', initialPosition);
    
    // Set the isHandlingExternalUpdate flag to prevent feedback loops
    isHandlingExternalUpdate.current = true;
    
    // Update the origin
    setOrigin(initialPosition);
    
    // Reset the flag after a short delay
    setTimeout(() => {
      isHandlingExternalUpdate.current = false;
    }, 50);
  }, [initialPosition, canvasSize]);
  
  // Store the previous measurement unit and pixel ratio to handle unit changes
  const [prevUnit, setPrevUnit] = useState<MeasurementUnit>(measurementUnit);
  const [prevPixelsPerCm, setPrevPixelsPerCm] = useState<number>(pixelsPerCm);

  // Add a ref for the position change timeout
  const positionChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Custom origin change handler that also tracks if origin has been manually moved
  const handleOriginChange = (newOrigin: Point) => {
    // Skip if we're currently handling an external update
    if (isHandlingExternalUpdate.current) {
      console.log('CanvasGrid: Skipping handleOriginChange during external update');
      return;
    }
    
    console.log('CanvasGrid: handleOriginChange called with', newOrigin);
    
    // Check if the change is significant enough to update
    const isSignificantChange = !origin || 
      Math.abs(newOrigin.x - origin.x) > 1 || 
      Math.abs(newOrigin.y - origin.y) > 1;
    
    if (isSignificantChange) {
      hasOriginMoved.current = true;
      
      // Use a local variable to prevent race conditions
      const updatedOrigin = { ...newOrigin };
      
      // Set the origin state
      setOrigin(updatedOrigin);
      
      // Notify parent component of position change, but only if it's a significant change
      // This prevents too many updates during dragging
      if (onPositionChange) {
        // Debounce the position change notification to prevent too many updates
        if (positionChangeTimeoutRef.current) {
          clearTimeout(positionChangeTimeoutRef.current);
        }
        
        // Only notify of position change when dragging stops or after a delay
        positionChangeTimeoutRef.current = setTimeout(() => {
          console.log('CanvasGrid: Notifying parent of position change (debounced)');
          // Use the local variable to ensure we're using the correct value
          onPositionChange(updatedOrigin);
          positionChangeTimeoutRef.current = null;
        }, 100); // 100ms debounce
      }
    } else {
      console.log('CanvasGrid: Ignoring small origin change to prevent oscillation');
    }
  };

  // Clean up the timeout when the component unmounts
  useEffect(() => {
    return () => {
      if (positionChangeTimeoutRef.current) {
        clearTimeout(positionChangeTimeoutRef.current);
      }
    };
  }, []);
  
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

  // Force re-render when canvas size changes significantly (like in fullscreen mode)
  useEffect(() => {
    const prevSize = prevCanvasSizeRef.current;
    const currentSize = canvasSize;
    
    // Always update the previous size reference to track changes
    prevCanvasSizeRef.current = { ...currentSize };
    
    // Check if canvas size has changed significantly (more than 50px in either dimension)
    // or if this is the first meaningful size (width and height > 0)
    const hasSignificantChange = 
      (Math.abs(prevSize.width - currentSize.width) > 50 || 
       Math.abs(prevSize.height - currentSize.height) > 50) &&
      currentSize.width > 0 && currentSize.height > 0;
    
    const isFirstMeaningfulSize = 
      (prevSize.width === 0 || prevSize.height === 0) && 
      currentSize.width > 0 && currentSize.height > 0;
    
    if (hasSignificantChange || isFirstMeaningfulSize) {
      console.log('CanvasGrid: Canvas size change detected, updating grid');
      
      // If we haven't moved the origin manually, center it in the new canvas
      if (!hasOriginMoved.current) {
        const newOrigin = {
          x: Math.floor(currentSize.width / 2),
          y: Math.floor(currentSize.height / 2)
        };
        
        setOrigin(newOrigin);
        
        // Notify parent of the position change
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