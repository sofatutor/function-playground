import { useCallback, useRef, useState } from 'react';
import { Formula, FormulaPoint } from '@/types/formula';
import { OperationMode } from '@/types/shapes';
import { FORMULA_NAVIGATION_STEP_SIZE } from '@/utils/constants';
import { logger } from '@/utils/logging';

interface SelectedPoint {
  x: number;
  y: number;
  mathX: number;
  mathY: number;
  formula: Formula;
  pointIndex?: number;
  allPoints?: FormulaPoint[];
  navigationStepSize?: number;
  isValid: boolean;
  // Add conversion parameters for navigation
  gridPosition?: { x: number; y: number };
  pixelsPerUnit?: number;
}

interface CurrentPointInfo {
  formulaId: string;
  pointIndex: number;
  allPoints: FormulaPoint[];
}

interface UseFormulaSelectionOptions {
  onFormulaSelect?: (formulaId: string) => void;
  onModeChange?: (mode: OperationMode) => void;
}

/**
 * Hook for managing formula point selection and navigation
 */
export const useFormulaSelection = ({ onFormulaSelect, onModeChange }: UseFormulaSelectionOptions) => {
  const [selectedPoint, setSelectedPoint] = useState<SelectedPoint | null>(null);
  const [currentPointInfo, setCurrentPointInfo] = useState<CurrentPointInfo | null>(null);
  const clickedOnPathRef = useRef(false);

  // Clear all selected points
  const clearAllSelectedPoints = useCallback(() => {
    setSelectedPoint(null);
    setCurrentPointInfo(null);
    clickedOnPathRef.current = false;
  }, []);

  // Handle formula point selection
  const handleFormulaPointSelect = useCallback((point: SelectedPoint | null) => {
    // Add more concise logging that doesn't dump the entire point object
    if (point) {
      logger.debug(`Point selected at math coordinates: (${point.mathX.toFixed(4)}, ${point.mathY.toFixed(4)})`);
    } else {
      logger.debug('Point selection cleared');
    }
    
    // Clear any existing selection first
    clearAllSelectedPoints();
    
    // Then set the new selection (if any)
    if (point) {
      // Set the clicked on path flag to true
      clickedOnPathRef.current = true;
      
      // Always ensure navigationStepSize has a default value
      const pointWithStepSize = {
        ...point,
        navigationStepSize: point.navigationStepSize || FORMULA_NAVIGATION_STEP_SIZE,
        isValid: true
      };
      
      setSelectedPoint(pointWithStepSize);
      
      // Store the current point index and all points if provided
      if (point.pointIndex !== undefined && point.allPoints) {
        setCurrentPointInfo({
          formulaId: point.formula.id,
          pointIndex: point.pointIndex,
          allPoints: point.allPoints
        });
      } else {
        setCurrentPointInfo(null);
      }
      
      // Select the formula in the function tool
      if (onFormulaSelect) {
        onFormulaSelect(point.formula.id);
      }
      
      // Switch to select mode
      if (onModeChange) {
        onModeChange('select');
      }
    } else {
      setSelectedPoint(null);
      setCurrentPointInfo(null);
    }
  }, [clearAllSelectedPoints, onFormulaSelect, onModeChange]);

  // Navigate to next/previous point in the formula
  const navigateFormulaPoint = useCallback((direction: 'next' | 'previous', isShiftPressed = false) => {
    logger.debug('navigateFormulaPoint called with direction:', direction, 'shift:', isShiftPressed);
    
    if (!selectedPoint || !currentPointInfo) {
      logger.debug('No selectedPoint or currentPointInfo, returning');
      return;
    }
    
    // Get the current point's mathematical X coordinate
    const currentMathX = selectedPoint.mathX;
    
    // Round to 4 decimal places to handle floating point precision issues
    const roundedMathX = Math.round(currentMathX * 10000) / 10000;
    
    // Calculate the step size for navigation
    const stepSize = isShiftPressed ? 1.0 : (selectedPoint.navigationStepSize || FORMULA_NAVIGATION_STEP_SIZE);
    
    // Calculate the next/previous X coordinate
    const nextMathX = direction === 'next' ? 
      Math.round((roundedMathX + stepSize) * 10000) / 10000 :
      Math.round((roundedMathX - stepSize) * 10000) / 10000;
    
    logger.debug(`Navigating from ${roundedMathX} to ${nextMathX} with step ${stepSize}`);
    
    // Find the closest point in the formula's allPoints array
    const { allPoints } = currentPointInfo;
    if (!allPoints || allPoints.length === 0) {
      logger.debug('No allPoints available for navigation');
      return;
    }
    
    // Find the point with the closest math X coordinate to our target
    let closestPoint: FormulaPoint | null = null;
    let closestDistance = Infinity;
    let closestIndex = -1;

    for (let i = 0; i < allPoints.length; i++) {
      const point = allPoints[i];
      // Convert screen coordinates to math coordinates for comparison
      let pointMathX: number;
      if (selectedPoint.gridPosition && selectedPoint.pixelsPerUnit) {
        pointMathX = (point.x - selectedPoint.gridPosition.x) / selectedPoint.pixelsPerUnit;
      } else {
        // Without conversion context, approximate using screen X
        pointMathX = point.x;
      }

      const distance = Math.abs(pointMathX - nextMathX);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = point;
        closestIndex = i;
      }
    }

    const hasUsableClosest = closestPoint != null && closestDistance > 0.000001;

    if (hasUsableClosest) {
      // Calculate math coordinates for the closest point
      let closestPointMathX: number;
      let closestPointMathY: number;
      if (selectedPoint.gridPosition && selectedPoint.pixelsPerUnit) {
        closestPointMathX = (closestPoint.x - selectedPoint.gridPosition.x) / selectedPoint.pixelsPerUnit;
        closestPointMathY = -(closestPoint.y - selectedPoint.gridPosition.y) / selectedPoint.pixelsPerUnit;
      } else {
        // Approximate with screen coordinates when conversion context is unavailable
        closestPointMathX = closestPoint.x;
        closestPointMathY = closestPoint.y;
      }
      
      logger.debug(`Found closest point at index ${closestIndex} with mathX ${closestPointMathX}`);
      
      // Create the new selected point with all required properties
      const newSelectedPoint: SelectedPoint = {
        x: closestPoint.x,
        y: closestPoint.y,
        mathX: closestPointMathX,
        mathY: closestPointMathY,
        formula: selectedPoint.formula,
        pointIndex: closestIndex,
        allPoints: allPoints,
        navigationStepSize: stepSize,
        isValid: true,
        gridPosition: selectedPoint.gridPosition,
        pixelsPerUnit: selectedPoint.pixelsPerUnit
      };
      
      // Update the selected point
      setSelectedPoint(newSelectedPoint);
      
      // Update current point info
      setCurrentPointInfo({
        formulaId: selectedPoint.formula.id,
        pointIndex: closestIndex,
        allPoints: allPoints
      });
    } else {
      // Fallback: directly evaluate the function at nextMathX for sub-0.1 steps
      const { formula } = selectedPoint;
      const expression = formula.expression;
      try {
        const fn = new Function('x', `try { const Math = window.Math; return ${expression}; } catch (e) { return NaN; }`);
        const rawY = fn(nextMathX);
        if (typeof rawY === 'number' && isFinite(rawY)) {
          const scaledMathY = rawY * (formula.scaleFactor || 1);
          const pxPerUnit = selectedPoint.pixelsPerUnit || 1;
          const gp = selectedPoint.gridPosition || { x: 0, y: 0 };
          const canvasX = gp.x + nextMathX * pxPerUnit;
          const canvasY = gp.y - scaledMathY * pxPerUnit;

          const newSelectedPoint: SelectedPoint = {
            x: canvasX,
            y: canvasY,
            mathX: nextMathX,
            mathY: scaledMathY,
            formula: selectedPoint.formula,
            navigationStepSize: stepSize,
            isValid: true,
            gridPosition: selectedPoint.gridPosition,
            pixelsPerUnit: selectedPoint.pixelsPerUnit,
            allPoints: allPoints,
          };
          setSelectedPoint(newSelectedPoint);
          // Keep currentPointInfo unchanged; we're not mapping to a discrete index here
        } else {
          logger.debug('Evaluation produced invalid number; skipping navigation');
        }
      } catch (err) {
        logger.error('Error evaluating formula during fine navigation:', err);
      }
    }
  }, [selectedPoint, currentPointInfo]);

  // Adjust the navigation step size (ArrowUp/ArrowDown behavior)
  const adjustNavigationStep = useCallback((increase: boolean) => {
    setSelectedPoint(prev => {
      if (!prev) return prev;
      const current = prev.navigationStepSize || FORMULA_NAVIGATION_STEP_SIZE;
      const updated = increase ? Math.min(1.0, +(current + 0.01).toFixed(2)) : Math.max(0.01, +(current - 0.01).toFixed(2));
      return { ...prev, navigationStepSize: updated };
    });
  }, []);

  return {
    selectedPoint,
    currentPointInfo,
    clearAllSelectedPoints,
    handleFormulaPointSelect,
    navigateFormulaPoint,
    adjustNavigationStep,
    clickedOnPathRef,
  };
};