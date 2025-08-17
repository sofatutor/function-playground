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

  return {
    selectedPoint,
    currentPointInfo,
    clearAllSelectedPoints,
    handleFormulaPointSelect,
    clickedOnPathRef,
  };
};