import React from 'react';
import { AnyShape, Point, OperationMode, ShapeType, Circle, Rectangle, Triangle } from '@/types/shapes';
import { getCanvasPoint, getShapeAtPosition, rotatePoint } from './CanvasUtils';
import { snapToGrid, getGridModifiers } from '@/utils/grid/gridUtils';
import { ShapeServiceFactory } from '@/services/ShapeService';

export interface EventHandlerParams {
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
  gridPosition?: Point | null;
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
  serviceFactory?: ShapeServiceFactory;
}

export const createHandleMouseDown = (params: EventHandlerParams) => {
  const {
    canvasRef,
    shapes,
    activeMode,
    selectedShapeId,
    pixelsPerSmallUnit,
    gridPosition,
    setIsDrawing,
    setDrawStart,
    setDrawCurrent,
    setDragStart,
    setOriginalPosition,
    onShapeSelect,
    onShapeMove
  } = params;
  
  // Replace the existing snapToGrid function with our new utility
  const handleSnapToGrid = (point: Point): Point => {
    return snapToGrid(
      point,
      gridPosition,
      true,
      'cm',
      0,
      pixelsPerSmallUnit
    );
  };
  
  return (e: React.MouseEvent) => {
    // Prevent default to avoid text selection
    e.preventDefault();
    
    const point = getCanvasPoint(e, canvasRef);
    
    // Always store the raw point for drag operations
    setDragStart(point);
    
    // Get keyboard modifiers using our utility
    const { shiftPressed, altPressed } = getGridModifiers(e);
    
    // If Shift is pressed but not Alt+Shift together, snap the effective point to the grid
    const effectivePoint = (shiftPressed && !altPressed && pixelsPerSmallUnit && pixelsPerSmallUnit > 0) 
      ? handleSnapToGrid(point) 
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
    gridPosition,
    setDrawCurrent,
    onShapeMove,
    onShapeResize,
    onShapeRotate
  } = params;
  
  // Replace the existing snapToGrid function with our new utility
  const handleSnapToGrid = (point: Point): Point => {
    return snapToGrid(
      point,
      gridPosition,
      true,
      'cm',
      0,
      pixelsPerSmallUnit
    );
  };
  
  return (e: React.MouseEvent) => {
    const point = getCanvasPoint(e, canvasRef);
    
    // Get keyboard modifiers using our utility
    const { shiftPressed, altPressed } = getGridModifiers(e);
    
    if (activeMode === 'create' && isDrawing && drawStart) {
      // When Shift is pressed, snap to millimeter grid
      if (shiftPressed && pixelsPerSmallUnit && pixelsPerSmallUnit > 0) {
        const snappedPoint = handleSnapToGrid(point);
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
        
        // If Shift key is pressed but not Alt+Shift together, snap to the grid
        if (shiftPressed && !altPressed && pixelsPerSmallUnit && pixelsPerSmallUnit > 0) {
          // Apply different snapping logic based on shape type
          if (selectedShape.type === 'circle') {
            // For circles, we want to snap the left and top edges
            const leftEdge = { x: newPosition.x - selectedShape.radius, y: newPosition.y };
            const topEdge = { x: newPosition.x, y: newPosition.y - selectedShape.radius };
            
            // Snap the edges to the grid
            const snappedLeftEdge = handleSnapToGrid(leftEdge);
            const snappedTopEdge = handleSnapToGrid(topEdge);
            
            // Adjust the position to maintain the snapped edges
            newPosition = {
              x: snappedLeftEdge.x + selectedShape.radius,
              y: snappedTopEdge.y + selectedShape.radius
            };
          } else if (selectedShape.type === 'rectangle') {
            // For rectangles, we want to snap the top-left corner
            const topLeft = { 
              x: newPosition.x - selectedShape.width / 2, 
              y: newPosition.y - selectedShape.height / 2 
            };
            
            // Snap the top-left corner to the grid
            const snappedTopLeft = handleSnapToGrid(topLeft);
            
            // Adjust the position to maintain the snapped corner
            newPosition = {
              x: snappedTopLeft.x + selectedShape.width / 2,
              y: snappedTopLeft.y + selectedShape.height / 2
            };
            
            // Add debug logging
            console.log('Rectangle snapping:', {
              topLeft,
              snappedTopLeft,
              final: newPosition
            });
          } else {
            // For other shapes, just snap the center
            newPosition = handleSnapToGrid(newPosition);
          }
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
      if (shiftPressed && pixelsPerSmallUnit && originalSize) {
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
      
      // Calculate mouse movement
      const dx = point.x - rotateStart.x;
      
      // Use a fixed rotation speed based on mouse movement
      // This approach is independent of where the handle was clicked
      const ROTATION_SPEED = 0.002; // radians per pixel of mouse movement
      let angleDiff = dx * ROTATION_SPEED;
      
      // If shift key is pressed, snap to absolute multiples of 15 degrees (π/12 radians)
      if (shiftPressed) {
        // Calculate the new rotation angle
        const newRotation = originalRotation + angleDiff;
        // Snap to the nearest absolute multiple of 15 degrees (π/12 radians)
        const snapAngle = Math.PI / 12; // 15 degrees in radians
        const snappedRotation = Math.round(newRotation / snapAngle) * snapAngle;
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
    gridPosition,
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
  const handleSnapToGrid = (point: Point): Point => {
    return snapToGrid(
      point,
      gridPosition,
      true,
      'cm',
      0,
      pixelsPerSmallUnit
    );
  };
  
  return (e: React.MouseEvent) => {
    const point = getCanvasPoint(e, canvasRef);
    
    // If Shift is pressed, snap the final point to the grid
    const effectivePoint = (e.shiftKey && pixelsPerSmallUnit && pixelsPerSmallUnit > 0) 
      ? handleSnapToGrid(point) 
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
          ? handleSnapToGrid(drawStart) 
          : drawStart;
        const effectiveEnd = (e.shiftKey && pixelsPerSmallUnit && pixelsPerSmallUnit > 0) 
          ? handleSnapToGrid(drawCurrent) 
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
    gridPosition,
    onShapeMove,
    onShapeResize
  } = params;
  
  // Helper function to snap a point to the grid
  const handleSnapToGrid = (point: Point): Point => {
    return snapToGrid(
      point,
      gridPosition,
      true,
      'cm',
      0,
      pixelsPerSmallUnit
    );
  };
  
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
    const smallDistance = pixelsPerSmallUnit || 1;
    const largeDistance = pixelsPerUnit || 10;
    
    // Determine the distance to move based on whether Shift key is pressed
    const distance = e.shiftKey ? largeDistance : smallDistance;
    
    // Define scaling factors
    const smallScaleFactor = 1.05; // 5% increase/decrease
    const largeScaleFactor = 1.1;  // 10% increase/decrease
    
    // Determine the scale factor based on whether Shift key is pressed
    const scaleFactor = e.shiftKey ? largeScaleFactor : smallScaleFactor;
    
    // Handle key presses
    switch (e.key) {
      // Movement keys
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
        
      // Scaling keys
      case '+':
      case '=': // = is on the same key as + without shift
        // Scale up
        onShapeResize(selectedShapeId, scaleFactor);
        e.preventDefault();
        console.log(`Scaled shape ${selectedShapeId} up by factor ${scaleFactor}`);
        return; // Exit early as we don't need to move the shape
        
      case '-':
      case '_': // _ is on the same key as - with shift
        // Scale down
        onShapeResize(selectedShapeId, 1 / scaleFactor);
        e.preventDefault();
        console.log(`Scaled shape ${selectedShapeId} down by factor ${1 / scaleFactor}`);
        return; // Exit early as we don't need to move the shape
        
      default:
        return; // Exit if not a handled key
    }
    
    // Snap to grid if enabled (not pressing Alt key)
    if (!e.altKey && pixelsPerSmallUnit && pixelsPerSmallUnit > 0 && gridPosition) {
      // Apply different snapping logic based on shape type
      if (selectedShape.type === 'circle') {
        // For circles, we want to snap the left and top edges
        const leftEdge = { x: newPosition.x - selectedShape.radius, y: newPosition.y };
        const topEdge = { x: newPosition.x, y: newPosition.y - selectedShape.radius };
        
        // Snap the edges to the grid
        const snappedLeftEdge = handleSnapToGrid(leftEdge);
        const snappedTopEdge = handleSnapToGrid(topEdge);
        
        // Adjust the position to maintain the snapped edges
        newPosition.x = snappedLeftEdge.x + selectedShape.radius;
        newPosition.y = snappedTopEdge.y + selectedShape.radius;
      } else if (selectedShape.type === 'rectangle') {
        // For rectangles, we want to snap the top-left corner
        const topLeft = { 
          x: newPosition.x - selectedShape.width / 2, 
          y: newPosition.y - selectedShape.height / 2 
        };
        
        // Snap the top-left corner to the grid
        const snappedTopLeft = handleSnapToGrid(topLeft);
        
        // Adjust the position to maintain the snapped corner
        newPosition.x = snappedTopLeft.x + selectedShape.width / 2;
        newPosition.y = snappedTopLeft.y + selectedShape.height / 2;
      } else {
        // For other shapes, just snap the center
        const snappedPosition = handleSnapToGrid(newPosition);
        newPosition.x = snappedPosition.x;
        newPosition.y = snappedPosition.y;
      }
    }
    
    // Move the shape to the new position
    onShapeMove(selectedShapeId, newPosition);
    
    // Log the movement for debugging
    console.log(`Moved shape ${selectedShapeId} with key ${e.key} to`, newPosition);
  };
}; 