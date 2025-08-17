import React from 'react';
import FormulaGraph from '../FormulaGraph';
import { Formula, FormulaPoint } from '@/types/formula';
import { Point } from '@/types/shapes';
import { Z_INDEX } from '@/utils/constants';

interface FormulaLayerProps {
  formulas?: Formula[];
  gridPosition: Point | null;
  zoomedPixelsPerUnit: number;
  selectedPoint: {
    x: number;
    y: number;
    mathX: number;
    mathY: number;
    formula: Formula;
    pointIndex?: number;
    allPoints?: FormulaPoint[];
    navigationStepSize?: number;
    isValid: boolean;
  } | null;
  onPointSelect: (point: {
    x: number;
    y: number;
    mathX: number; 
    mathY: number;
    formula: Formula;
    pointIndex?: number;
    allPoints?: FormulaPoint[];
    navigationStepSize?: number;
    isValid: boolean;
  } | null) => void;
}

/**
 * Renders all formula-related layers
 */
const FormulaLayer: React.FC<FormulaLayerProps> = React.memo(({
  formulas,
  gridPosition,
  zoomedPixelsPerUnit,
  selectedPoint,
  onPointSelect,
}) => {
  // Early return if no formulas or grid position
  if (!formulas || formulas.length === 0 || !gridPosition) {
    return null;
  }
  
  return (
    <div style={{ zIndex: Z_INDEX.FORMULAS }}>
      {formulas.map(formula => (
        <FormulaGraph
          key={formula.id}
          formula={formula}
          gridPosition={gridPosition}
          pixelsPerUnit={zoomedPixelsPerUnit}
          onPointSelect={onPointSelect}
          globalSelectedPoint={selectedPoint}
        />
      ))}
    </div>
  );
});

FormulaLayer.displayName = 'FormulaLayer';

export default FormulaLayer;