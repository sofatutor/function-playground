import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { InlineMath } from 'react-katex';
import { AnyShape, MeasurementUnit } from '@/types/shapes';
import { useTranslate } from '@/utils/translate';
import { getFormula } from '@/utils/geometryUtils';
import { useConfig } from '@/context/ConfigContext';
import { normalizeAngleDegrees } from '@/utils/geometry/rotation';

interface MeasurementItemProps {
  measureKey: string;
  value: string;
  shape: AnyShape;
  measurementUnit: MeasurementUnit;
  editingKey: string | null;
  editValue: string;
  onStartEdit: (key: string, value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

const MeasurementItem: React.FC<MeasurementItemProps> = ({
  measureKey,
  value,
  shape,
  measurementUnit,
  editingKey,
  editValue,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onInputChange,
  onKeyPress
}) => {
  const t = useTranslate();
  const { language } = useConfig();
  
  // Format measurement values
  const formatValue = (key: string, value: string): string => {
    // For angles, display as integers in the range [-180, 180]
    if (key.startsWith('angle')) {
      const angle = parseFloat(value);
      return Math.round(angle).toString();
    }
    // For all other measurements, ensure they have at most 2 decimal places
    return parseFloat(value).toFixed(2);
  };
  
  // Determine which measurements are editable
  const isEditable = (key: string): boolean => {
    // Area and perimeter are calculated, not directly editable
    if (key === 'area' || key === 'perimeter') return false;
    
    // Angles in triangles are calculated, not directly editable
    if (shape.type === 'triangle' && key === 'angles') return false;
    
    // Height in triangles is calculated, not directly editable
    if (shape.type === 'triangle' && key === 'height') return false;
    
    // Make individual angles editable for triangles
    if (shape.type === 'triangle' && (key === 'angle1' || key === 'angle2' || key === 'angle3')) return true;
    
    return true;
  };

  // Determine input step and min values based on measurement type
  const getInputProps = (key: string) => {
    if (key.startsWith('angle')) {
      return {
        step: "1",
        min: "-180",
        max: "180"
      };
    }
    return {
      step: "0.01",
      min: "0.01"
    };
  };
  
  // Prevent event propagation to the canvas
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEditable(measureKey)) {
      onStartEdit(measureKey, formatValue(measureKey, value));
    }
  };
  
  // Check if this measurement has a formula tooltip
  const hasFormula = 
    measureKey === 'area' || 
    measureKey === 'perimeter' || 
    measureKey === 'circumference' || 
    (shape.type === 'triangle' && (
      measureKey === 'height' || 
      measureKey === 'angles' || 
      measureKey === 'angle1' || 
      measureKey === 'angle2' || 
      measureKey === 'angle3'
    ));

  // Get the translated label for this measurement
  const measurementLabel = t(`measurementLabels.${measureKey}`);

  return (
    <div 
      className="flex flex-col"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onMouseUp={(e) => e.stopPropagation()}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="text-xs text-muted-foreground cursor-help flex items-center">
              {measurementLabel}
              {hasFormula && (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-3 w-3 text-muted-foreground">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <path d="M12 17h.01"></path>
                </svg>
              )}
            </span>
          </TooltipTrigger>
          {hasFormula && (
            <TooltipContent side="top" className="max-w-xs p-4">
              <div className="space-y-2">
                <div className="font-medium">{t('formula')}:</div>
                <div className="katex-formula">
                  <InlineMath math={getFormula(shape.type, measureKey, language)} />
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {t(`formulaExplanations.${shape.type}.${measureKey}`)}
                </div>
              </div>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
      
      {editingKey === measureKey ? (
        <div 
          className="flex items-center space-x-1 mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Input
            className="h-6 text-sm"
            value={editValue}
            onChange={onInputChange}
            onKeyDown={(e) => {
              e.stopPropagation();
              onKeyPress(e);
            }}
            autoFocus
            type="number"
            {...getInputProps(measureKey)}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={(e) => {
                e.stopPropagation();
                onSaveEdit();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-6 w-6" 
              onClick={(e) => {
                e.stopPropagation();
                onCancelEdit();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </Button>
          </div>
        </div>
      ) : (
        <div 
          className={`measurement-value font-medium ${isEditable(measureKey) ? 'cursor-pointer hover:text-geometry-primary' : ''}`}
          onClick={handleClick}
        >
          {formatValue(measureKey, value)} {t(`unitSuffixes.${measureKey}`, { unit: measurementUnit })}
          {isEditable(measureKey) && (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-1 h-3 w-3 text-muted-foreground">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          )}
        </div>
      )}
    </div>
  );
};

export default MeasurementItem; 