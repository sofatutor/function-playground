import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Formula, FormulaPoint } from '@/types/formula';
import { Point } from '@/types/shapes';
import { evaluateFormula } from '@/utils/formulaUtils';
import { isGridDragging } from '@/components/CanvasGrid/GridDragHandler';

interface FormulaGraphProps {
  formula: Formula;
  gridPosition: Point;
  pixelsPerUnit: number;
  onPointSelect?: (point: { x: number, y: number, mathX: number, mathY: number, formula: Formula } | null) => void;
  globalSelectedPoint?: { x: number, y: number, mathX: number, mathY: number, formula: Formula } | null;
}

const FormulaGraph: React.FC<FormulaGraphProps> = ({ 
  formula, 
  gridPosition, 
  pixelsPerUnit,
  onPointSelect,
  globalSelectedPoint
}) => {
  // Track if we're currently dragging to optimize rendering
  const isDraggingRef = useRef(false);
  const lastEvaluationTimeRef = useRef(0);
  const lastGridPositionRef = useRef<Point | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedPoint, setSelectedPoint] = useState<{ index: number, point: FormulaPoint } | null>(null);
  
  // Update local selected point when global selected point changes
  useEffect(() => {
    // If there's no global selected point or it's for a different formula, clear local selection
    if (!globalSelectedPoint || globalSelectedPoint.formula.id !== formula.id) {
      setSelectedPoint(null);
    }
  }, [globalSelectedPoint, formula.id]);
  
  // Force re-evaluation when grid position changes significantly
  const gridPositionKey = useMemo(() => {
    // Round to nearest 0.5 pixel for more responsive updates
    const roundedX = Math.round(gridPosition.x * 2) / 2;
    const roundedY = Math.round(gridPosition.y * 2) / 2;
    return `${roundedX},${roundedY}`;
  }, [gridPosition]);
  
  // Detect rapid changes in grid position (indicating dragging)
  useEffect(() => {
    const now = Date.now();
    
    // If this is the first update or it's been a while since the last update, it's not dragging
    if (!lastGridPositionRef.current || now - lastEvaluationTimeRef.current > 300) {
      isDraggingRef.current = false;
    } else {
      // If we're getting rapid updates, we're likely dragging
      isDraggingRef.current = true;
    }
    
    // Update the last evaluation time and grid position
    lastEvaluationTimeRef.current = now;
    lastGridPositionRef.current = gridPosition;
  }, [gridPosition]);

  // Check if this is a tangent function
  const isTangent = formula.expression.includes('Math.tan(') || 
                    formula.expression === 'Math.tan(x)' || 
                    formula.expression.includes('tan(x)');

  // Calculate points for the formula
  const points = useMemo(() => {
    // Set updating state to true
    setIsUpdating(true);
    
    console.log(`Evaluating formula: ${formula.expression} with gridPosition:`, gridPosition, `pixelsPerUnit: ${pixelsPerUnit}`);
    
    // Check both our local dragging detection and the global grid dragging flag
    const draggingMode = isDraggingRef.current || isGridDragging.value;
    
    // Use requestAnimationFrame to ensure smooth updates
    let result: FormulaPoint[] = [];
    
    // Use a timeout to ensure we don't block the UI thread
    const evaluateAsync = () => {
      result = evaluateFormula(formula, gridPosition, pixelsPerUnit, draggingMode);
      console.log(`Generated ${result.length} points for formula (dragging: ${draggingMode})`);
      setIsUpdating(false);
    };
    
    // If we're dragging, use a shorter timeout to ensure responsiveness
    if (draggingMode) {
      setTimeout(evaluateAsync, 0);
      // Return empty points initially, they'll be updated when the evaluation completes
      return [];
    } else {
      // If not dragging, evaluate synchronously
      result = evaluateFormula(formula, gridPosition, pixelsPerUnit, draggingMode);
      setIsUpdating(false);
      return result;
    }
  }, [formula, gridPositionKey, pixelsPerUnit]); // Use gridPositionKey instead of gridPosition

  // Log when points are updated
  useEffect(() => {
    if (points.length > 0) {
      console.log(`Formula ${formula.id} has ${points.length} points, x-range: [${points[0].x} to ${points[points.length-1].x}]`);
    }
    
    // Clear selected point when points change
    setSelectedPoint(null);
  }, [points, formula.id]);

  // Helper function to build a path string for the graph
  const createPath = (points: FormulaPoint[]): string => {
    if (points.length === 0) return '';

    let path = '';
    let penDown = false;
    
    // Get approximate canvas dimensions
    const canvasWidth = window.innerWidth;
    const canvasHeight = window.innerHeight;
    
    // Function to check if a point is within the visible canvas area with some margin
    const isWithinCanvas = (x: number, y: number): boolean => {
      const margin = 1000; // Allow points slightly outside the visible area
      return x >= -margin && x <= canvasWidth + margin && 
             y >= -margin && y <= canvasHeight + margin;
    };

    // Function to detect large jumps in y values that indicate discontinuities
    const isDiscontinuity = (p1: FormulaPoint, p2: FormulaPoint): boolean => {
      if (!p1.isValid || !p2.isValid) return true;
      
      // Check for large vertical jumps that indicate discontinuities
      const MAX_JUMP = isTangent ? 50 : 100; // Stricter for tangent functions
      return Math.abs(p2.y - p1.y) > MAX_JUMP;
    };

    // First pass: process points and handle discontinuities
    let i = 0;
    while (i < points.length) {
      const point = points[i];
      const withinCanvas = isWithinCanvas(point.x, point.y);
      
      if (point.isValid && withinCanvas) {
        // Check for discontinuity with previous point
        if (i > 0 && isDiscontinuity(points[i-1], point)) {
          // End the current path segment
          penDown = false;
        }
        
        if (!penDown) {
          // Start a new subpath
          path += ` M ${point.x},${point.y}`;
          penDown = true;
        } else {
          // Continue the path
          path += ` L ${point.x},${point.y}`;
        }
      } else {
        // Invalid point or outside canvas, lift the pen
        penDown = false;
      }
      
      i++;
    }

    return path;
  };

  const pathString = createPath(points);

  // Handle path click to select a point
  const handlePathClick = (event: React.MouseEvent) => {
    if (!onPointSelect) return;
    
    // Don't handle point selection if we're in the middle of a grid drag operation
    if (isGridDragging.value) {
      return;
    }
    
    // Stop propagation to prevent the canvas from handling the click
    event.stopPropagation();
    
    // Get click coordinates relative to the SVG
    const svgElement = event.currentTarget.closest('svg');
    if (!svgElement) return;
    
    const svgRect = svgElement.getBoundingClientRect();
    const clickX = event.clientX - svgRect.left;
    const clickY = event.clientY - svgRect.top;
    
    // Find the closest point to the click
    if (!points || points.length === 0) return;
    
    let closestPointIndex = -1;
    let minDistance = Number.MAX_VALUE;
    
    points.forEach((point, index) => {
      if (!point.isValid) return;
      
      const dx = point.x - clickX;
      const dy = point.y - clickY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestPointIndex = index;
      }
    });
    
    // Only select if within a reasonable distance (15px)
    if (closestPointIndex >= 0 && minDistance <= 15) {
      const point = points[closestPointIndex];
      
      // Update local state
      setSelectedPoint({ index: closestPointIndex, point });
      
      // Convert canvas coordinates back to mathematical coordinates
      const mathX = (point.x - gridPosition.x) / pixelsPerUnit;
      const mathY = -(point.y - gridPosition.y) / pixelsPerUnit;
      
      // Notify parent
      onPointSelect({
        x: point.x,
        y: point.y,
        mathX,
        mathY,
        formula
      });
    } else {
      // If no point is close enough, clear the selection
      setSelectedPoint(null);
      onPointSelect(null);
    }
  };

  // Clear selection when clicking on the SVG background
  const handleSvgClick = (event: React.MouseEvent) => {
    // Don't clear points if we're in the middle of a grid drag operation
    if (isGridDragging.value) {
      return;
    }
    
    // Only handle if the click is directly on the SVG (not on a path)
    if (event.target === event.currentTarget && onPointSelect) {
      // Clear local selection
      setSelectedPoint(null);
      
      // Clear global selection
      onPointSelect(null);
      
      // Stop propagation to prevent multiple handlers from firing
      event.stopPropagation();
    }
  };

  // If we're updating and there's no path, show a placeholder
  if (isUpdating && !pathString) {
    return (
      <g>
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          fill={formula.color}
          fontSize="12"
          opacity="0.7"
        >
          Updating formula...
        </text>
        <circle
          cx="50%"
          cy="55%"
          r="5"
          fill="none"
          stroke={formula.color}
          strokeWidth="2"
          opacity="0.7"
          className="animate-spin"
        />
      </g>
    );
  }

  if (!pathString) {
    return null;
  }

  // Use a key that includes the grid position to force re-rendering when grid moves
  // For tangent functions, we use a fixed key since we're always showing the same period
  const renderKey = isTangent 
    ? `${formula.id}-tangent-fixed` 
    : `${formula.id}-${gridPositionKey}`;

  return (
    <>
      {isUpdating && (
        <text x="50%" y="50%" textAnchor="middle" fill="gray">
          Updating...
        </text>
      )}
      
      {pathString && (
        <path
          key={renderKey}
          d={pathString}
          stroke={formula.color}
          strokeWidth={formula.strokeWidth}
          fill="none"
          className="formula-graph"
          style={{ 
            opacity: isUpdating ? 0.5 : 1,
            transition: 'opacity 0.2s ease-in-out',
            pointerEvents: isGridDragging.value ? 'none' : 'stroke', // Disable pointer events during grid dragging
            cursor: isGridDragging.value ? 'grabbing' : 'pointer' // Change cursor during grid dragging
          }}
          onMouseDown={(e) => {
            // Prevent handling mouse down if grid is being dragged
            if (isGridDragging.value) {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
          onMouseMove={(e) => {
            // Prevent handling mouse move if grid is being dragged
            if (isGridDragging.value) {
              e.stopPropagation();
              e.preventDefault();
            }
          }}
          onMouseUp={(e) => {
            // Prevent handling mouse up if grid is being dragged
            if (isGridDragging.value) {
              e.stopPropagation();
              e.preventDefault();
              return;
            }
            handlePathClick(e);
          }}
        />
      )}
      
      {/* Only render the selected point if this formula has the selected point */}
      {selectedPoint && globalSelectedPoint && globalSelectedPoint.formula.id === formula.id && (
        <circle
          cx={selectedPoint.point.x}
          cy={selectedPoint.point.y}
          r={5}
          fill={formula.color}
          stroke="white"
          strokeWidth={2}
          className="formula-point-selected"
          style={{ pointerEvents: 'none' }}
        />
      )}
    </>
  );
};

export default FormulaGraph;
