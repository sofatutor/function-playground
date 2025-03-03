import React from 'react';
import { AnyShape, Point, OperationMode, ShapeType, Circle, Rectangle, Triangle } from '@/types/shapes';
import { getCanvasPoint, getShapeAtPosition, rotatePoint } from './CanvasUtils';

interface EventHandlerParams {
  canvasRef: React.RefObject<HTMLDivElement>;
  shapes: AnyShape[];
  activeMode: OperationMode;
  activeShapeType: ShapeType;
  selectedShapeId: string | null;
  isDrawing: boolean;
  drawStart: Point | null;
  drawCurrent: Point | null;
  dragStart: Point | null;
  originalPosition: Point | null;
  resizeStart: Point | null;
  originalSize: number | null;
  rotateStart: Point | null;
  originalRotation: number;
  pixelsPerUnit?: number;
  pixelsPerSmallUnit?: number;
  measurementUnit?: string;
  setIsDrawing: (value: boolean) => void;
  setDrawStart: (point: Point | null) => void;
  setDrawCurrent: (point: Point | null) => void;
  setDragStart: (point: Point | null) => void;
  setOriginalPosition: (point: Point | null) => void;
  setResizeStart: (point: Point | null) => void;
  setOriginalSize: (size: number | null) => void;
  setRotateStart: (point: Point | null) => void;
  setOriginalRotation: (rotation: number) => void;
  onShapeSelect: (id: string | null) => void;
  onShapeCreate: (start: Point, end: Point) => string;
  onShapeMove: (id: string, newPosition: Point) => void;
  onShapeResize: (id: string, factor: number) => void;
  onShapeRotate: (id: string, angle: number) => void;
  onModeChange?: (mode: OperationMode) => void;
}

export const createHandleMouseDown = (params: EventHandlerParams) => {
  const {
    canvasRef,
    shapes,
    activeMode,
    selectedShapeId,
    pixelsPerSmallUnit,
    setIsDrawing,
    setDrawStart,
    setDrawCurrent,
    setDragStart,
    setOriginalPosition,
    onShapeSelect,
    onShapeMove
  } = params;
  
  // Helper function to snap a point to the millimeter grid
  const snapToGrid = (point: Point): Point => {
    // Check if pixelsPerSmallUnit is defined and valid
    if (!pixelsPerSmallUnit || pixelsPerSmallUnit <= 0) {
      return point;
    }
    
    // Snap to grid - use Math.floor for consistent snapping behavior
    return {
      x: Math.floor(point.x / pixelsPerSmallUnit) * pixelsPerSmallUnit,
      y: Math.floor(point.y / pixelsPerSmallUnit) * pixelsPerSmallUnit
    };
  };
  
  return (e: React.MouseEvent) => {
    // Prevent default to avoid text selection
    e.preventDefault();
    
    const point = getCanvasPoint(e, canvasRef);
    
    // Always store the raw point for drag operations
    setDragStart(point);
    
    // If Shift is pressed but not Alt+Shift together, snap the effective point to the grid for drawing operations
    const effectivePoint = (e.shiftKey && !e.altKey && pixelsPerSmallUnit && pixelsPerSmallUnit > 0) 
      ? snapToGrid(point) 
      : point;
    
    if (activeMode === 'select' || activeMode === 'move') {
      const shape = getShapeAtPosition(point, shapes);
      
      if (shape) {
        // If a shape is clicked, select it and prepare for potential movement
        if (selectedShapeId !== shape.id) {
          onShapeSelect(shape.id);
        }
        
        // Find the selected shape
        const selectedShape = shapes.find(s => s.id === shape.id);
        if (selectedShape) {
          // Always store the original position without snapping
          // This allows for smooth dragging until Shift is pressed
          setOriginalPosition(selectedShape.position);
        }
      } else if (activeMode === 'select') {
        // If clicking on empty space in select mode, deselect
        onShapeSelect(null);
      }
    } else if (activeMode === 'create') {
      setIsDrawing(true);
      setDrawStart(effectivePoint);
      setDrawCurrent(effectivePoint);
    }
  };
};

export const createHandleMouseMove = (params: EventHandlerParams) => {
  const {
    canvasRef,
    shapes,
    activeMode,
    selectedShapeId,
    isDrawing,
    drawStart,
    dragStart,
    originalPosition,
    resizeStart,
    originalSize,
    rotateStart,
    originalRotation,
    pixelsPerSmallUnit,
    setDrawCurrent,
    onShapeMove,
    onShapeResize,
    onShapeRotate
  } = params;
  
  // Helper function to snap a point to the millimeter grid
  const snapToGrid = (point: Point): Point => {
    // Check if pixelsPerSmallUnit is defined and valid
    if (!pixelsPerSmallUnit || pixelsPerSmallUnit <= 0) {
      return point;
    }
    
    // Snap to grid - use Math.floor to ensure we snap to the exact grid line pixel
    // rather than rounding to the nearest grid line
    return {
      x: Math.floor(point.x / pixelsPerSmallUnit) * pixelsPerSmallUnit,
      y: Math.floor(point.y / pixelsPerSmallUnit) * pixelsPerSmallUnit
    };
  };
  
  return (e: React.MouseEvent) => {
    const point = getCanvasPoint(e, canvasRef);
    
    if (activeMode === 'create' && isDrawing && drawStart) {
      // When Shift is pressed, snap to millimeter grid
      if (e.shiftKey && pixelsPerSmallUnit && pixelsPerSmallUnit > 0) {
        const snappedPoint = snapToGrid(point);
        setDrawCurrent(snappedPoint);
      } else {
        // Normal behavior without snapping
        setDrawCurrent(point);
      }
    } else if ((activeMode === 'select' || activeMode === 'move') && dragStart && originalPosition && selectedShapeId) {
      // Calculate the offset from the drag start
      const dx = point.x - dragStart.x;
      const dy = point.y - dragStart.y;
      
      // Only start moving if the mouse has moved a minimum distance or we're already in move mode
      const dragDistance = Math.sqrt(dx * dx + dy * dy);
      if (dragDistance > 3 || activeMode === 'move') {
        // Get the current shape to find its actual position
        const selectedShape = shapes.find(s => s.id === selectedShapeId);
        if (!selectedShape) return;
        
        // Calculate the new position by applying the offset to the original position
        let newPosition = {
          x: originalPosition.x + dx,
          y: originalPosition.y + dy
        };
        
        // If Shift key is pressed but not Alt+Shift together, snap the current position directly to the grid
        if (e.shiftKey && !e.altKey && pixelsPerSmallUnit && pixelsPerSmallUnit > 0) {
          // Directly snap the current position to the grid
          newPosition = snapToGrid(newPosition);
        }
        
        // Move the shape to the new position
        onShapeMove(selectedShapeId, newPosition);
      }
    } else if (activeMode === 'resize' && resizeStart && originalSize !== null && selectedShapeId) {
      const selectedShape = shapes.find(s => s.id === selectedShapeId);
      if (!selectedShape) return;
      
      // Calculate the distance from the shape center to the current point
      const distanceCurrent = Math.sqrt(
        Math.pow(point.x - selectedShape.position.x, 2) + 
        Math.pow(point.y - selectedShape.position.y, 2)
      );
      
      // Calculate the distance from the shape center to the resize start point
      const distanceStart = Math.sqrt(
        Math.pow(resizeStart.x - selectedShape.position.x, 2) + 
        Math.pow(resizeStart.y - selectedShape.position.y, 2)
      );
      
      // Calculate the resize factor
      let factor = distanceCurrent / distanceStart;
      
      // If Shift key is pressed, snap the size to millimeter increments
      if (e.shiftKey && pixelsPerSmallUnit && originalSize) {
        // Calculate the new size
        const newSize = originalSize * factor;
        // Snap to the nearest millimeter
        const snappedSize = Math.round(newSize / pixelsPerSmallUnit) * pixelsPerSmallUnit;
        // Recalculate the factor based on the snapped size
        factor = snappedSize / originalSize;
      }
      
      // Apply the resize
      onShapeResize(selectedShapeId, originalSize * factor);
    } else if (activeMode === 'rotate' && rotateStart && selectedShapeId) {
      const selectedShape = shapes.find(s => s.id === selectedShapeId);
      if (!selectedShape) return;
      
      // Calculate the angle between the shape center, the rotate start, and the current point
      const center = selectedShape.position;
      
      // Calculate the angle of the initial vector (center to rotateStart)
      const startAngle = Math.atan2(
        rotateStart.y - center.y,
        rotateStart.x - center.x
      ) * (180 / Math.PI);
      
      // Calculate the angle of the current vector (center to current point)
      const currentAngle = Math.atan2(
        point.y - center.y,
        point.x - center.x
      ) * (180 / Math.PI);
      
      // Calculate the angle difference
      let angleDiff = currentAngle - startAngle;
      
      // If shift key is pressed, snap to absolute multiples of 15 degrees
      if (e.shiftKey) {
        // Calculate the new rotation angle
        const newRotation = originalRotation + angleDiff;
        // Snap to the nearest absolute multiple of 15 degrees (0, 15, 30, 45, etc.)
        const snappedRotation = Math.round(newRotation / 15) * 15;
        // Adjust the angle difference to achieve the snapped rotation
        angleDiff = snappedRotation - originalRotation;
      }
      
      // Apply the rotation
      onShapeRotate(selectedShapeId, originalRotation + angleDiff);
    }
  };
};

export const createHandleMouseUp = (params: EventHandlerParams) => {
  const {
    canvasRef,
    activeMode,
    isDrawing,
    drawStart,
    drawCurrent,
    pixelsPerSmallUnit,
    setIsDrawing,
    setDrawStart,
    setDrawCurrent,
    setDragStart,
    setOriginalPosition,
    setResizeStart,
    setOriginalSize,
    setRotateStart,
    setOriginalRotation,
    onShapeCreate,
    onModeChange
  } = params;
  
  // Helper function to snap a point to the millimeter grid
  const snapToGrid = (point: Point): Point => {
    // Check if pixelsPerSmallUnit is defined and valid
    if (!pixelsPerSmallUnit || pixelsPerSmallUnit <= 0) {
      return point;
    }
    
    // Snap to grid - use Math.floor for consistent snapping behavior
    return {
      x: Math.floor(point.x / pixelsPerSmallUnit) * pixelsPerSmallUnit,
      y: Math.floor(point.y / pixelsPerSmallUnit) * pixelsPerSmallUnit
    };
  };
  
  return (e: React.MouseEvent) => {
    const point = getCanvasPoint(e, canvasRef);
    
    // If Shift is pressed, snap the final point to the grid
    const effectivePoint = (e.shiftKey && pixelsPerSmallUnit && pixelsPerSmallUnit > 0) 
      ? snapToGrid(point) 
      : point;
    
    if (activeMode === 'create' && isDrawing && drawStart && drawCurrent) {
      // Only create shape if the user has dragged a minimum distance
      const distance = Math.sqrt(
        Math.pow(drawCurrent.x - drawStart.x, 2) + 
        Math.pow(drawCurrent.y - drawStart.y, 2)
      );
      
      if (distance > 5) {
        // If Shift is pressed, use snapped points for both start and end
        const effectiveStart = (e.shiftKey && pixelsPerSmallUnit && pixelsPerSmallUnit > 0) 
          ? snapToGrid(drawStart) 
          : drawStart;
        const effectiveEnd = (e.shiftKey && pixelsPerSmallUnit && pixelsPerSmallUnit > 0) 
          ? snapToGrid(drawCurrent) 
          : drawCurrent;
        
        // Create a new shape
        onShapeCreate(effectiveStart, effectiveEnd);
        
        // Switch to select mode after creating a shape
        if (onModeChange) {
          onModeChange('select');
        }
      }
      
      // Reset drawing state
      setIsDrawing(false);
      setDrawStart(null);
      setDrawCurrent(null);
    } else if (activeMode === 'select' || activeMode === 'move') {
      // Reset dragging state
      setDragStart(null);
      setOriginalPosition(null);
    } else if (activeMode === 'resize') {
      // Reset resizing state
      setResizeStart(null);
      setOriginalSize(null);
    } else if (activeMode === 'rotate') {
      // Reset rotation state
      setRotateStart(null);
      setOriginalRotation(0);
    }
  };
};

export const createHandleResizeStart = (params: EventHandlerParams) => {
  const {
    canvasRef,
    shapes,
    selectedShapeId,
    setResizeStart,
    setOriginalSize
  } = params;
  
  return (e: React.MouseEvent) => {
    if (!selectedShapeId) return;
    
    const point = getCanvasPoint(e, canvasRef);
    const selectedShape = shapes.find(s => s.id === selectedShapeId);
    
    if (selectedShape) {
      setResizeStart(point);
      
      // Store the original size based on shape type
      if (selectedShape.type === 'circle') {
        setOriginalSize((selectedShape as Circle).radius);
      } else if (selectedShape.type === 'rectangle') {
        // For rectangle, use the diagonal as the size
        const rect = selectedShape as Rectangle;
        setOriginalSize(Math.sqrt(Math.pow(rect.width, 2) + Math.pow(rect.height, 2)) / 2);
      } else if (selectedShape.type === 'triangle') {
        // For triangle, use the distance from center to a vertex
        const tri = selectedShape as Triangle;
        const vertex = tri.points[0];
        const distance = Math.sqrt(
          Math.pow(vertex.x - tri.position.x, 2) + 
          Math.pow(vertex.y - tri.position.y, 2)
        );
        setOriginalSize(distance);
      }
    }
  };
};

export const createHandleRotateStart = (params: EventHandlerParams) => {
  const {
    canvasRef,
    shapes,
    selectedShapeId,
    setRotateStart,
    setOriginalRotation
  } = params;
  
  return (e: React.MouseEvent) => {
    if (!selectedShapeId) return;
    
    const point = getCanvasPoint(e, canvasRef);
    const selectedShape = shapes.find(s => s.id === selectedShapeId);
    
    if (selectedShape) {
      setRotateStart(point);
      setOriginalRotation(selectedShape.rotation);
    }
  };
};

export const createHandleKeyDown = (params: EventHandlerParams) => {
  const {
    shapes,
    selectedShapeId,
    pixelsPerUnit,
    pixelsPerSmallUnit,
    measurementUnit,
    onShapeMove
  } = params;
  
  return (e: KeyboardEvent) => {
    // Only handle keyboard events if a shape is selected
    if (!selectedShapeId) return;
    
    // Find the selected shape
    const selectedShape = shapes.find(s => s.id === selectedShapeId);
    if (!selectedShape) return;
    
    // Get current position
    const currentPosition = selectedShape.position;
    const newPosition = { ...currentPosition };
    
    // Define movement distances
    // Small movement (mm or 1/10 inch) when using arrow keys
    // Large movement (cm or inch) when using Shift+arrow keys
    const smallDistance = pixelsPerSmallUnit;
    const largeDistance = pixelsPerUnit;
    
    // Determine the distance to move based on whether Shift key is pressed
    const distance = e.shiftKey ? largeDistance : smallDistance;
    
    // Handle arrow key presses
    switch (e.key) {
      case 'ArrowUp':
        newPosition.y -= distance;
        e.preventDefault();
        break;
      case 'ArrowDown':
        newPosition.y += distance;
        e.preventDefault();
        break;
      case 'ArrowLeft':
        newPosition.x -= distance;
        e.preventDefault();
        break;
      case 'ArrowRight':
        newPosition.x += distance;
        e.preventDefault();
        break;
      default:
        return; // Exit if not an arrow key
    }
    
    // Move the shape to the new position
    onShapeMove(selectedShapeId, newPosition);
  };
}; 