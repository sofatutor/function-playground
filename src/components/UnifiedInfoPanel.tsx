import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AnyShape, MeasurementUnit, Point } from '@/types/shapes';
import { Formula } from '@/types/formula';
import { useTranslate } from '@/utils/translate';
import MeasurementItem from './MeasurementPanel/MeasurementItem';
import ShapeIcon from './MeasurementPanel/ShapeIcon';
import { normalizeAngleDegrees } from '@/utils/geometry/rotation';

interface UnifiedInfoPanelProps {
  // Shape info props
  selectedShape: AnyShape | null;
  measurements: Record<string, string>;
  measurementUnit: MeasurementUnit;
  onMeasurementUpdate: (key: string, value: string) => void;
  
  // Point info props
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
}

const UnifiedInfoPanel: React.FC<UnifiedInfoPanelProps> = ({
  // Shape info props
  selectedShape,
  measurements,
  measurementUnit,
  onMeasurementUpdate,
  
  // Point info props
  point,
  gridPosition,
  pixelsPerUnit
}) => {
  const t = useTranslate();
  
  // State to track which measurement is being edited
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  // Function to handle starting edit mode
  const handleStartEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditValue(value);
  };
  
  // Function to handle saving the edited value
  const handleSaveEdit = () => {
    if (editingKey) {
      // For angles, ensure we're using normalized integer values
      if (editingKey.startsWith('angle')) {
        const angleValue = parseFloat(editValue);
        // Normalize angle to the range [-180, 180]
        const normalizedAngle = normalizeAngleDegrees(angleValue);
        const intValue = Math.round(normalizedAngle).toString();
        onMeasurementUpdate(editingKey, intValue);
      } else {
        onMeasurementUpdate(editingKey, editValue);
      }
      setEditingKey(null);
    }
  };
  
  // Function to handle canceling the edit
  const handleCancelEdit = () => {
    setEditingKey(null);
  };
  
  // Function to handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditValue(value);
  };
  
  // Function to handle key press events
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Prevent click events from propagating to the canvas
  const handlePanelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Format the coordinates with appropriate precision for point info
  const formatNumber = (num: number): string => {
    // Use fewer decimal places for larger numbers
    if (Math.abs(num) >= 100) return num.toFixed(1);
    if (Math.abs(num) >= 10) return num.toFixed(2);
    if (Math.abs(num) >= 1) return num.toFixed(3);
    return num.toFixed(4);
  };

  // Create a human-readable expression for formula
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

  // Calculate Y value for point info
  const calculateY = () => {
    if (!point || !point.formula) return '';
    
    const { mathX, mathY, formula, isValid } = point;
    
    if (!isValid) {
      return t('calculationError');
    }
    
    // Special handling for parametric and polar functions
    if (formula.type === 'parametric') {
      return t('parametricPointInfo');
    }
    
    if (formula.type === 'polar') {
      return t('polarPointInfo');
    }
    
    // For regular functions, show the calculation
    const expr = formatExpression(formula.expression);
    return `${expr.replace(/x/g, `(${formatNumber(mathX)})`)} = ${formatNumber(mathY)}`;
  };

  // If neither shape nor point is selected, show nothing
  if (!selectedShape && !point) {
    return null;
  }

  // Determine what content to show based on what's selected
  const renderContent = () => {
    // If a shape is selected, show shape info
    if (selectedShape) {
      return (
        <>
          <div className="flex items-center space-x-2 mb-3">
            <ShapeIcon shapeType={selectedShape.type} />
            <span className="text-sm font-medium">
              {t(`shapeNames.${selectedShape.type}`)}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(measurements).map(([key, value]) => (
              <MeasurementItem
                key={key}
                measureKey={key}
                value={value}
                shape={selectedShape}
                measurementUnit={measurementUnit}
                editingKey={editingKey}
                editValue={editValue}
                onStartEdit={handleStartEdit}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onInputChange={handleInputChange}
                onKeyPress={handleKeyPress}
              />
            ))}
          </div>
        </>
      );
    }
    
    // If a point is selected, show point info
    if (point) {
      return (
        <>
          <div className="flex items-center mb-3">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: point.formula.color }}
            />
            <span className="text-sm font-medium">
              {formatExpression(point.formula.expression)}
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">{t('pointX')}:</span> {formatNumber(point.mathX)}
              </div>
              <div>
                <span className="text-muted-foreground">{t('pointY')}:</span> {formatNumber(point.mathY)}
              </div>
            </div>
            
            <div className="text-sm pt-2 border-t">
              <span className="text-muted-foreground">{t('calculation')}:</span>
              <div className="font-mono text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                {calculateY()}
              </div>
            </div>
            
            {/* Navigation step size and keyboard controls */}
            <div className="text-sm pt-2 border-t">
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
        </>
      );
    }
    
    // Fallback (should never happen due to the check above)
    return null;
  };

  return (
    <Card 
      className="w-full shadow-lg border-2 bg-card/95 backdrop-blur-sm unified-info-panel"
      onClick={handlePanelClick}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
      onMouseMove={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
    >
      <CardContent className="p-4">
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default UnifiedInfoPanel; 