import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AnyShape, MeasurementUnit, Point } from '@/types/shapes';
import { Formula } from '@/types/formula';
import { useTranslate } from '@/utils/translate';
import MeasurementItem from './MeasurementPanel/MeasurementItem';
import ShapeIcon from './MeasurementPanel/ShapeIcon';
import { normalizeAngleDegrees } from '@/utils/geometry/rotation';
import { useIsMobile } from '@/hooks/use-mobile';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { convertToLatex, formatExpressionForDisplay, getFormulaLatexDisplay } from '@/utils/formulaUtils';

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
  
  // Point navigation prop
  onNavigatePoint?: (direction: 'prev' | 'next', stepSize: number) => void;
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
  pixelsPerUnit,
  
  // Point navigation prop
  onNavigatePoint
}) => {
  const t = useTranslate();
  const isMobile = useIsMobile();
  
  // State to track which measurement is being edited
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  // Add state to track measurements for re-rendering
  const [currentMeasurements, setCurrentMeasurements] = useState<Record<string, string>>({});
  
  // Update local measurements state when props change
  useEffect(() => {
    if (measurements && Object.keys(measurements).length > 0) {
      // Create a new object to ensure React detects the change
      setCurrentMeasurements({...measurements});
      
      // If we're currently editing a measurement, update the edit value
      if (editingKey && measurements[editingKey]) {
        setEditValue(measurements[editingKey]);
      }
    } else {
      setCurrentMeasurements({});
    }
  }, [measurements, editingKey]);
  
  // Add keyboard event listener for arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!point) return;
      
      if (e.key === 'ArrowLeft') {
        console.log('Navigate to previous point');
        // In a real implementation, this would call a function to navigate
      } else if (e.key === 'ArrowRight') {
        console.log('Navigate to next point');
        // In a real implementation, this would call a function to navigate
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [point]);
  
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
    setEditValue(e.target.value);
  };
  
  // Function to handle key press events
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Add a function to handle point navigation
  const handleNavigatePoint = (direction: 'prev' | 'next', e: React.MouseEvent) => {
    // Prevent the event from propagating to the canvas
    e.stopPropagation();
    e.preventDefault();
    
    if (onNavigatePoint && point) {
      onNavigatePoint(direction, point.navigationStepSize || 0.1);
    } else {
      console.log(`Navigate ${direction} point`);
    }
  };

  // Prevent click events from propagating to the canvas
  const handlePanelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Format the coordinates with appropriate precision for point info
  const formatNumber = (num: number): string => {
    // Use fewer decimal places for larger numbers
    let formatted: string;
    if (Math.abs(num) >= 100) formatted = num.toFixed(1);
    else if (Math.abs(num) >= 10) formatted = num.toFixed(2);
    else if (Math.abs(num) >= 1) formatted = num.toFixed(3);
    else formatted = num.toFixed(4);
    
    // Strip trailing zeros after the decimal point
    return formatted.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
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
    
    return getFormulaLatexDisplay(formula, mathX, mathY);
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
          <CardHeader className="p-2 sm:p-3 pb-0 sm:pb-1">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <ShapeIcon shapeType={selectedShape.type} />
              {t(`shapeNames.${selectedShape.type}`)}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('shapeInfo')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-1 sm:pt-2">
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(currentMeasurements).map(([key, value]) => (
                <MeasurementItem
                  key={key}
                  measureKey={key}
                  value={value}
                  shape={selectedShape}
                  measurementUnit={measurementUnit}
                  editingKey={editingKey}
                  editValue={editValue}
                  onStartEdit={handleStartEdit}
                  onCancelEdit={handleCancelEdit}
                  onSaveEdit={handleSaveEdit}
                  onInputChange={handleInputChange}
                  onKeyPress={handleKeyPress}
                />
              ))}
            </div>
          </CardContent>
        </>
      );
    }
    
    // If a point is selected, show point info
    if (point) {
      return (
        <>
          <CardHeader className="p-2 sm:p-3 pb-0 sm:pb-1">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              {/* Display the formula expression or default title */}
              {point.formula.expression ? (
                <div className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: point.formula.color }}
                  />
                  <InlineMath math={convertToLatex(point.formula.expression)} />
                </div>
              ) : (
                t('pointInfoTitle')
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              {t('pointInfo')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-2 sm:p-3 pt-1 sm:pt-2">
            <div className="space-y-2">
              {/* Point coordinates */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs font-medium mb-1">X Coordinate</div>
                  <div className="text-sm bg-muted p-1 rounded">{formatNumber(point.mathX)}</div>
                </div>
                <div>
                  <div className="text-xs font-medium mb-1">Y Coordinate</div>
                  <div className="text-sm bg-muted p-1 rounded">{formatNumber(point.mathY)}</div>
                </div>
              </div>
              
              {/* Calculation */}
              <div>
                <div className="text-xs font-medium mb-1">Calculation</div>
                <div className="text-sm bg-muted p-1 rounded break-all">
                  <InlineMath math={calculateY()} />
                </div>
              </div>
              
              {/* Navigation */}
              <div>
                <div className="text-xs font-medium mb-1">Navigation</div>
                <div className="flex items-center text-xs">
                  <button 
                    className="p-1 hover:bg-muted rounded point-nav-button"
                    onClick={(e) => handleNavigatePoint('prev', e)}
                    aria-label="Previous Point"
                    data-nav-button="prev"
                  >
                    <div className="flex items-center">
                      <span className="mr-1">←</span>
                      <span className="hidden sm:inline text-muted-foreground">(Left Arrow)</span>
                    </div>
                  </button>
                  <div className="flex-1 text-center whitespace-nowrap overflow-visible">
                    <div className="flex justify-center items-center">
                      <span className="mr-1">Step:</span>
                      <InlineMath math={formatNumber(point.navigationStepSize || 1.00)} />
                    </div>
                  </div>
                  <button 
                    className="p-1 hover:bg-muted rounded point-nav-button"
                    onClick={(e) => handleNavigatePoint('next', e)}
                    aria-label="Next Point"
                    data-nav-button="next"
                  >
                    <div className="flex items-center">
                      <span className="mr-1">→</span>
                      <span className="hidden sm:inline text-muted-foreground">(Right Arrow)</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </>
      );
    }
    
    // Fallback (should never happen due to the check above)
    return null;
  };

  return (
    <Card className={`w-full border-0 shadow-none ${isMobile ? 'p-0' : 'p-2'}`}>
      {renderContent()}
    </Card>
  );
};

export default UnifiedInfoPanel;
