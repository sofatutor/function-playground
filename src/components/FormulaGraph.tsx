
import React, { useMemo } from 'react';
import { Formula, FormulaPoint } from '@/types/formula';
import { Point } from '@/types/shapes';
import { evaluateFormula } from '@/utils/formulaUtils';

interface FormulaGraphProps {
  formula: Formula;
  gridPosition: Point;
  pixelsPerUnit: number;
}

const FormulaGraph: React.FC<FormulaGraphProps> = ({ formula, gridPosition, pixelsPerUnit }) => {
  // Calculate points for the formula
  const points = useMemo(() => {
    if (!formula.visible) return [];
    return evaluateFormula(formula, gridPosition, pixelsPerUnit);
  }, [formula, gridPosition, pixelsPerUnit]);

  // Helper function to build a path string for the graph
  const createPath = (points: FormulaPoint[]): string => {
    if (points.length === 0) return '';

    let path = '';
    let penDown = false;

    points.forEach((point, index) => {
      if (point.isValid) {
        if (!penDown && index > 0) {
          // Start a new subpath if we're coming from an invalid point
          path += ` M ${point.x},${point.y}`;
          penDown = true;
        } else if (!penDown) {
          // First valid point
          path += `M ${point.x},${point.y}`;
          penDown = true;
        } else {
          // Continue the path
          path += ` L ${point.x},${point.y}`;
        }
      } else {
        // Invalid point, lift the pen
        penDown = false;
      }
    });

    return path;
  };

  const pathString = createPath(points);

  if (!pathString || !formula.visible) {
    return null;
  }

  return (
    <path
      d={pathString}
      stroke={formula.color}
      strokeWidth={formula.strokeWidth}
      fill="none"
      className="formula-graph"
    />
  );
};

export default FormulaGraph;
