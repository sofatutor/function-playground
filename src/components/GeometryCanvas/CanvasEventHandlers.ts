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
    setIsDrawing,
    setDrawStart,
    setDrawCurrent,
    setDragStart,
    setOriginalPosition,
    onShapeSelect
  } = params;
  
  return (e: React.MouseEvent) => {
    // Prevent default to avoid text selection
    e.preventDefault();
    
    const point = getCanvasPoint(e, canvasRef);
    
    if (activeMode === 'select') {
      const shape = getShapeAtPosition(point, shapes);
      
      if (shape) {
        // If a shape is clicked, select it and prepare for potential movement
        onShapeSelect(shape.id);
        setDragStart(point);
        
        // Store the original position for calculating movement delta
        const selectedShape = shapes.find(s => s.id === shape.id);
        if (selectedShape) {
          setOriginalPosition(selectedShape.position);
        }
      } else {
        // If clicking on empty space in select mode, deselect
        onShapeSelect(null);
      }
    } else if (activeMode === 'move') {
      const shape = getShapeAtPosition(point, shapes);
      
      if (shape) {
        // If a shape is clicked in move mode, prepare for movement
        if (selectedShapeId !== shape.id) {
          onShapeSelect(shape.id);
        }
        
        setDragStart(point);
        
        // Store the original position for calculating movement delta
        const selectedShape = shapes.find(s => s.id === shape.id);
        if (selectedShape) {
          setOriginalPosition(selectedShape.position);
        }
      }
    } else if (activeMode === 'create') {
      setIsDrawing(true);
      setDrawStart(point);
      setDrawCurrent(point);
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
    setDrawCurrent,
    onShapeMove,
    onShapeResize,
    onShapeRotate
  } = params;
  
  return (e: React.MouseEvent) => {
    const point = getCanvasPoint(e, canvasRef);
    
    if (activeMode === 'create' && isDrawing && drawStart) {
      // For line tool, add precision mode when Shift key is pressed
      if (e.shiftKey) {
        // Calculate a more precise point by reducing the movement from the start point
        const dx = point.x - drawStart.x;
        const dy = point.y - drawStart.y;
        
        // Slow down the movement by a factor of 0.25 for precision
        const precisionPoint = {
          x: drawStart.x + dx * 0.25,
          y: drawStart.y + dy * 0.25
        };
        
        setDrawCurrent(precisionPoint);
      } else {
        setDrawCurrent(point);
      }
    } else if (activeMode === 'select' && dragStart && originalPosition && selectedShapeId) {
      // Calculate the offset from the drag start
      const dx = point.x - dragStart.x;
      const dy = point.y - dragStart.y;
      
      // Only start moving if the mouse has moved a minimum distance
      const dragDistance = Math.sqrt(dx * dx + dy * dy);
      if (dragDistance > 3) {
        // Apply the offset to the original position
        const newPosition = {
          x: originalPosition.x + dx,
          y: originalPosition.y + dy
        };
        
        // Update the shape position
        onShapeMove(selectedShapeId, newPosition);
      }
    } else if (activeMode === 'move' && dragStart && originalPosition && selectedShapeId) {
      // Calculate the offset from the drag start
      const dx = point.x - dragStart.x;
      const dy = point.y - dragStart.y;
      
      // Apply the offset to the original position
      const newPosition = {
        x: originalPosition.x + dx,
        y: originalPosition.y + dy
      };
      
      // Update the shape position
      onShapeMove(selectedShapeId, newPosition);
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
      const factor = distanceCurrent / distanceStart;
      
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
      
      // Slow down rotation for lines to make it less sensitive to mouse movements
      if (selectedShape.type === 'line') {
        // Reduce rotation speed by 75% for lines
        angleDiff = angleDiff * 0.25;
      }
      
      // If shift key is pressed, snap to absolute multiples of 15 degrees
      if (e.shiftKey) {
        // Calculate the new rotation angle
        const newRotation = originalRotation + angleDiff;
        // Snap to the nearest absolute multiple of 15 degrees (0, 15, 30, 45, etc.)
        const snappedRotation = Math.floor(newRotation / 15) * 15;
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
  
  return (e: React.MouseEvent) => {
    const point = getCanvasPoint(e, canvasRef);
    
    if (activeMode === 'create' && isDrawing && drawStart && drawCurrent) {
      // Only create shape if the user has dragged a minimum distance
      const distance = Math.sqrt(
        Math.pow(drawCurrent.x - drawStart.x, 2) + 
        Math.pow(drawCurrent.y - drawStart.y, 2)
      );
      
      if (distance > 5) {
        // Create a new shape
        onShapeCreate(drawStart, drawCurrent);
        
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