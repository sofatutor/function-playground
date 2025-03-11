import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Formula, FormulaPoint } from '@/types/formula';
import { Point } from '@/types/shapes';
import { evaluateFormula } from '@/utils/formulaUtils';
import { isGridDragging } from '@/components/CanvasGrid/GridDragHandler';

interface FormulaGraphProps {
  formula: Formula;
  gridPosition: Point;
  pixelsPerUnit: number;
  onPointSelect?: (point: FormulaPoint & {
    mathX: number;
    mathY: number;
    formula: Formula;
    pointIndex?: number;
    allPoints?: FormulaPoint[];
    navigationStepSize?: number;
  } | null) => void;
  globalSelectedPoint?: (FormulaPoint & {
    mathX: number;
    mathY: number;
    formula: Formula;
    pointIndex?: number;
    allPoints?: FormulaPoint[];
    navigationStepSize?: number;
  }) | null;
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
  // Add a ref to store the last valid points
  const lastValidPointsRef = useRef<FormulaPoint[]>([]);
  
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

  // Check if this is a logarithmic function
  const isLogarithmic = formula.expression.includes('Math.log(') ||
                        formula.expression.includes('Math.log10(') ||
                        formula.expression.includes('Math.log2(') ||
                        formula.expression.includes('log(') ||
                        formula.expression.includes('ln(');

  // Check if this is a trigonometric function
  const hasTrigFunction = formula.expression.includes('Math.sin(') || 
                          formula.expression.includes('Math.cos(') ||
                          formula.expression.includes('sin(') || 
                          formula.expression.includes('cos(');

  // Calculate points for the formula
  const points = useMemo(() => {
    // Set updating state to true
    setIsUpdating(true);
    
    console.log(`Evaluating formula: ${formula.expression} with gridPosition:`, gridPosition, `pixelsPerUnit: ${pixelsPerUnit}`);
    
    // Check both our local dragging detection and the global grid dragging flag
    const draggingMode = isDraggingRef.current || isGridDragging.value;
    
    // Use a timeout to ensure we don't block the UI thread
    const evaluateAsync = () => {
      const result = evaluateFormula(formula, gridPosition, pixelsPerUnit, draggingMode);
      
      // Store the result as the last valid points if it's not empty
      if (result.length > 0) {
        lastValidPointsRef.current = result;
      }

      console.log(`Generated ${result.length} points for formula (dragging: ${draggingMode})`);
      setIsUpdating(false);
    };

    // If we're dragging, use a shorter timeout to ensure responsiveness
    if (draggingMode) {
      setTimeout(evaluateAsync, 0);
      // Return last valid points during dragging instead of empty array
      return lastValidPointsRef.current;
    } else {
      // If not dragging, evaluate synchronously
      const result = evaluateFormula(formula, gridPosition, pixelsPerUnit, draggingMode);
      
      // Store the result as the last valid points
      if (result.length > 0) {
        lastValidPointsRef.current = result;
      }

      setIsUpdating(false);
      return result;
    }
  }, [formula, gridPositionKey, pixelsPerUnit]); // Use gridPositionKey instead of gridPosition

  // Update local selected point when global selected point changes
  useEffect(() => {
    console.log('FormulaGraph: current formula id:', formula.id);
    
    // If there's no global selected point or it's for a different formula, clear local selection
    if (!globalSelectedPoint || globalSelectedPoint.formula.id !== formula.id) {
      console.log('FormulaGraph: Clearing local selection');
      setSelectedPoint(null);
      return;
    }
    
    console.log('FormulaGraph: Global selected point is for this formula');
    
    // If we have a global selected point for this formula, update the local selection
    if (globalSelectedPoint.pointIndex !== undefined && points.length > 0) {
      console.log('FormulaGraph: Using pointIndex to update local selection:', globalSelectedPoint.pointIndex);
      // Make sure the index is valid
      const index = globalSelectedPoint.pointIndex;
      if (index >= 0 && index < points.length) {
        console.log('FormulaGraph: Setting local selected point to index:', index);
        setSelectedPoint({
          index,
          point: points[index]
        });
      } else {
        console.log('FormulaGraph: Invalid index:', index, 'points length:', points.length);
      }
    } else if (points.length > 0) {
      console.log('FormulaGraph: No pointIndex, finding closest point');
      // If we don't have a pointIndex but we have coordinates, find the closest point
      const closestPointIndex = findClosestPointIndex(globalSelectedPoint.x, globalSelectedPoint.y);
      if (closestPointIndex >= 0) {
        console.log('FormulaGraph: Found closest point at index:', closestPointIndex);
        setSelectedPoint({
          index: closestPointIndex,
          point: points[closestPointIndex]
        });
      } else {
        console.log('FormulaGraph: No closest point found');
      }
    } else {
      console.log('FormulaGraph: No points available');
    }
  }, [globalSelectedPoint, formula.id, points]);
  
  // Helper function to find the closest point to given coordinates
  const findClosestPointIndex = (x: number, y: number): number => {
    if (!points || points.length === 0) return -1;
    
    let closestIndex = -1;
    let minDistance = Number.MAX_VALUE;
    
    points.forEach((point, index) => {
      if (!point.isValid) return;
      
      const dx = point.x - x;
      const dy = point.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance < minDistance) {
        minDistance = distance;
        closestIndex = index;
      }
    });
    
    return closestIndex;
  };
  
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
      // Determine appropriate margins based on function type
      let xMargin = 1000;
      let yMargin = 1000;
      
      // For logarithmic functions, use larger margins
      if (isLogarithmic) {
        xMargin = 20000;
        yMargin = 50000;
      }
      
      // For tangent functions, use much larger margins
      // Tangent functions have vertical asymptotes
      if (isTangent || 
          formula.expression.includes('Math.tan(x)') || 
          formula.expression.includes('tan(x)')) {
        xMargin = 10000;
        yMargin = 1000000; // Very large y-margin for tangent asymptotes
      }
      
      // For exponential functions, use much larger margins
      // Exponential functions grow extremely rapidly
      if (formula.expression.includes('Math.exp(x)') || 
          formula.expression.includes('exp(x)') ||
          formula.expression.includes('e^x')) {
        xMargin = 10000;
        yMargin = 1000000; // Very large y-margin for exponential growth
      }
      
      // For polynomial functions, especially higher degree ones, use larger margins
      if (formula.expression.includes('*x*x*x') || // Cubic or higher
          formula.expression.includes('x^3') || 
          formula.expression.includes('x**3')) {
        xMargin = 5000;
        yMargin = 100000; // Much larger y-margin for higher degree polynomials
      } else if (formula.expression.includes('*x*x') || // Quadratic
                formula.expression.includes('x^2') || 
                formula.expression.includes('x**2')) {
        xMargin = 3000;
        yMargin = 50000;
      }
      
      return x >= -xMargin && x <= canvasWidth + xMargin && 
             y >= -yMargin && y <= canvasHeight + yMargin;
    };

    // Function to detect large jumps in y values that indicate discontinuities
    const isDiscontinuity = (p1: FormulaPoint, p2: FormulaPoint): boolean => {
      if (!p1.isValid || !p2.isValid) return true;
      
      // Check for large vertical jumps that indicate discontinuities
      // Use different thresholds based on function type
      let MAX_JUMP = 100; // Default
      
      // For exponential functions, use a much higher threshold
      if (formula.expression.includes('Math.exp(x)') || 
          formula.expression.includes('exp(x)') ||
          formula.expression.includes('e^x')) {
        MAX_JUMP = 10000; // Exponential functions can have very large jumps
      }
      
      // For polynomial functions, use a higher threshold
      if (formula.expression.includes('*x*x') || 
          formula.expression.includes('x^') || 
          formula.expression.includes('x**')) {
        MAX_JUMP = 500;
      }
      
      // For tangent functions, use a much higher threshold
      if (isTangent || 
          formula.expression.includes('Math.tan(x)') || 
          formula.expression.includes('tan(x)')) {
        MAX_JUMP = 50000; // Tangent functions have vertical asymptotes
        
        // Special handling for tangent asymptotes
        // Check if the points are on opposite sides of an asymptote
        // For tan(x), asymptotes occur at x = (n + 0.5) * π
        const x1 = (p1.x - gridPosition.x) / pixelsPerUnit;
        const x2 = (p2.x - gridPosition.x) / pixelsPerUnit;
        
        // Check if there's a potential asymptote between x1 and x2
        // For tan(x), asymptotes are at x = (n + 0.5) * π
        const PI = Math.PI;
        const checkForAsymptote = (x1: number, x2: number): boolean => {
          // For tangent functions, we need to check if there's an asymptote between x1 and x2
          // Asymptotes occur at x = (n + 0.5) * π, where n is an integer
          
          // Make sure x1 < x2
          if (x1 > x2) {
            const temp = x1;
            x1 = x2;
            x2 = temp;
          }
          
          // More precise asymptote detection
          // Calculate the exact positions of asymptotes
          // Asymptotes occur at x = (n + 0.5) * π
          
          // Find the range of n values that could have asymptotes between x1 and x2
          const n1 = Math.floor(x1 / PI - 0.5);
          const n2 = Math.ceil(x2 / PI - 0.5);
          
          // Check each potential asymptote in the range
          for (let n = n1; n <= n2; n++) {
            const asymptote = (n + 0.5) * PI;
            if (asymptote > x1 && asymptote < x2) {
              return true; // Found an asymptote between the points
            }
          }
          
          // Additional check for points that are very close to asymptotes
          // This helps catch cases where numerical precision issues might miss an asymptote
          const distToAsymptote1 = Math.abs((x1 / PI - 0.5) % 1 - 0.5) * PI;
          const distToAsymptote2 = Math.abs((x2 / PI - 0.5) % 1 - 0.5) * PI;
          
          // If either point is very close to an asymptote (within 0.01 radians)
          // and they're on opposite sides, consider it a discontinuity
          if ((distToAsymptote1 < 0.01 || distToAsymptote2 < 0.01) && 
              Math.sign(Math.tan(x1)) !== Math.sign(Math.tan(x2))) {
            return true;
          }
          
          return false;
        };
        
        // If the points are likely on opposite sides of an asymptote, consider it a discontinuity
        if (checkForAsymptote(x1, x2)) {
          return true;
        }
        
        // Additional check: if the y-values have opposite signs and are both large,
        // it's likely an asymptote crossing
        const y1 = (gridPosition.y - p1.y) / pixelsPerUnit; // Convert to math coordinates
        const y2 = (gridPosition.y - p2.y) / pixelsPerUnit;
        
        // More robust check for asymptote crossing based on y-values
        // If both y-values are large in magnitude but have opposite signs,
        // and the x-values are close, it's very likely an asymptote
        if (Math.abs(y1) > 5 && Math.abs(y2) > 5 && 
            Math.sign(y1) !== Math.sign(y2) && 
            Math.abs(x2 - x1) < PI / 4) {
          return true;
        }
        
        // Another check: if the slope between points is extremely steep,
        // it's likely near an asymptote
        const slope = Math.abs((y2 - y1) / (x2 - x1));
        if (slope > 100) {
          return true;
        }
      }
      
      // Calculate the vertical distance between points
      const dy = Math.abs(p2.y - p1.y);
      
      // Calculate the horizontal distance between points
      const dx = Math.abs(p2.x - p1.x);
      
      // If the points are very close horizontally but far apart vertically,
      // it's likely a discontinuity
      return dy > MAX_JUMP && dx < 50;
    };

    // First pass: process points and handle discontinuities
    let i = 0;
    
    // Special handling for tangent functions to ensure proper asymptote rendering
    if (isTangent || 
        formula.expression.includes('Math.tan(x)') || 
        formula.expression.includes('tan(x)')) {
      
      // For tangent functions, we need to be more careful about discontinuities
      // We'll process points in segments between asymptotes
      
      while (i < points.length) {
        const point = points[i];
        const withinCanvas = isWithinCanvas(point.x, point.y);
        
        if (point.isValid && withinCanvas) {
          // Check for discontinuity with previous point
          if (i > 0 && isDiscontinuity(points[i-1], point)) {
            // End the current path segment at asymptote
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
    } else {
      // Standard handling for non-tangent functions
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
        isValid: true,
        mathX,
        mathY,
        formula,
        pointIndex: closestPointIndex,
        allPoints: points
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
      {globalSelectedPoint && globalSelectedPoint.formula.id === formula.id && (
        <circle
          cx={globalSelectedPoint.x}
          cy={globalSelectedPoint.y}
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
