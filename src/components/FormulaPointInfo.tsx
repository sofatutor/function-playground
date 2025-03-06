import React from 'react';
import { Formula } from '@/types/formula';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslate } from '@/utils/translate';
import { Point, MeasurementUnit } from '@/types/shapes';

interface FormulaPointInfoProps {
  point: {
    x: number;
    y: number;
    mathX: number;
    mathY: number;
    formula: Formula;
    navigationStepSize?: number;
    isValid?: boolean;
  } | null;
  gridPosition?: Point;
  pixelsPerUnit?: number;
  measurementUnit?: MeasurementUnit;
}

const FormulaPointInfo: React.FC<FormulaPointInfoProps> = ({ 
  point, 
  gridPosition, 
  pixelsPerUnit, 
  measurementUnit 
}) => {
  const t = useTranslate();

  if (!point) return null;

  const { mathX, mathY, formula, isValid } = point;
  
  // Format the coordinates with appropriate precision
  const formatNumber = (num: number): string => {
    // Use fewer decimal places for larger numbers
    if (Math.abs(num) >= 100) return num.toFixed(1);
    if (Math.abs(num) >= 10) return num.toFixed(2);
    if (Math.abs(num) >= 1) return num.toFixed(3);
    return num.toFixed(4);
  };

  // Create a human-readable expression
  const formatExpression = (expr: string): string => {
    return expr
      .replace(/Math\.sin/g, 'sin')
      .replace(/Math\.cos/g, 'cos')
      .replace(/Math\.tan/g, 'tan')
      .replace(/Math\.sqrt/g, 'sqrt')
      .replace(/Math\.abs/g, 'abs')
      .replace(/Math\.pow/g, 'pow')
      .replace(/Math\.log/g, 'ln')
      .replace(/Math\.exp/g, 'exp')
      .replace(/\*\*/g, '^')
      .replace(/\*/g, '×');
  };

  // Calculate the y value using the formula expression
  const calculateY = (): string => {
    try {
      // Create a simplified version of the calculation steps
      let calculation = '';
      
      // Handle different formula types
      if (formula.type === 'function') {
        // For regular functions, show the substitution
        const prettyExpression = formatExpression(formula.expression);
        calculation = `${prettyExpression.replace(/x/g, formatNumber(mathX))}`;
        
        // Add scale factor if not 1.0
        if (formula.scaleFactor !== 1.0) {
          calculation += ` × ${formatNumber(formula.scaleFactor)}`;
        }
        
        calculation += ` = ${formatNumber(mathY)}`;
      } else if (formula.type === 'parametric') {
        // For parametric functions, we'd need to find the t value, which is complex
        calculation = t('parametricPointInfo');
      } else if (formula.type === 'polar') {
        // For polar functions, we'd need to convert between coordinate systems
        calculation = t('polarPointInfo');
      }
      
      return calculation;
    } catch (error) {
      return t('calculationError');
    }
  };

  return (
    <Card className="w-full shadow-lg border-2 bg-card/95 backdrop-blur-sm formula-point-info">
      <CardHeader className="py-3">
        <CardTitle className="text-sm flex items-center">
          <div 
            className="w-3 h-3 rounded-full mr-2" 
            style={{ backgroundColor: formula.color }}
          />
          {formatExpression(formula.expression)}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">{t('pointX')}:</span> {formatNumber(mathX)}
            </div>
            <div>
              <span className="text-muted-foreground">{t('pointY')}:</span> {formatNumber(mathY)}
            </div>
          </div>
          
          <div className="text-sm mt-1 pt-2 border-t">
            <span className="text-muted-foreground">{t('calculation')}:</span>
            <div className="font-mono text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
              {calculateY()}
            </div>
          </div>
          
          {/* Navigation step size and keyboard controls */}
          <div className="text-sm mt-1 pt-2 border-t">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Navigation:</span>
              <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                Step: {(point.navigationStepSize || 0.1).toFixed(2)}
                {point.navigationStepSize === 1.0 && (
                  <span className="ml-1 text-amber-500">(Shift)</span>
                )}
              </span>
            </div>
            <div className="text-xs text-muted-foreground mt-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
              Navigate points
              <span className="mx-2">•</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M12 19V5M5 12l7-7 7 7"/>
              </svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                <path d="M12 5v14M19 12l-7 7-7-7"/>
              </svg>
              Adjust step size
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Hold <span className="font-mono bg-muted px-1 rounded">Shift</span> to temporarily use 1.0 step size
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FormulaPointInfo; 