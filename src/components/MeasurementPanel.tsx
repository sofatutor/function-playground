import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Circle, Square, Triangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import type { AnyShape, MeasurementUnit } from '@/types/shapes';
import { useTranslate } from '@/utils/translate';
import { getFormula } from '@/utils/geometryUtils';
import { useConfig } from '@/context/ConfigContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface MeasurementPanelProps {
  selectedShape: AnyShape | null;
  measurements: Record<string, string>;
  measurementUnit: MeasurementUnit;
  onMeasurementUpdate: (key: string, value: string) => void;
}

const MeasurementPanel: React.FC<MeasurementPanelProps> = ({ 
  selectedShape, 
  measurements, 
  measurementUnit,
  onMeasurementUpdate
}) => {
  const t = useTranslate();
  const { language } = useConfig();
  
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
      // For angles, ensure we're using integer values
      if (editingKey.startsWith('angle')) {
        const intValue = Math.round(parseFloat(editValue)).toString();
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

  // Function to format measurement values
  const formatValue = (key: string, value: string): string => {
    // For angles, display as integers
    if (key.startsWith('angle')) {
      return Math.round(parseFloat(value)).toString();
    }
    return value;
  };

  if (!selectedShape) {
    return (
      <Card className="w-full bg-white animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('measurements')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('selectShapeToViewMeasurements')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const ShapeIcon = () => {
    switch (selectedShape.type) {
      case 'circle':
        return <Circle className="h-5 w-5 text-geometry-secondary" />;
      case 'rectangle':
        return <Square className="h-5 w-5 text-geometry-secondary" />;
      case 'triangle':
        return <Triangle className="h-5 w-5 text-geometry-secondary" />;
      default:
        return null;
    }
  };

  const shapeName = t(`shapeNames.${selectedShape.type}`);
  
  // Determine which measurements are editable
  const isEditable = (key: string): boolean => {
    // Area and perimeter are calculated, not directly editable
    if (key === 'area' || key === 'perimeter') return false;
    
    // Angles in triangles are calculated, not directly editable
    if (selectedShape.type === 'triangle' && key === 'angles') return false;
    
    // Height in triangles is calculated, not directly editable
    if (selectedShape.type === 'triangle' && key === 'height') return false;
    
    // Make individual angles editable for triangles
    if (selectedShape.type === 'triangle' && (key === 'angle1' || key === 'angle2' || key === 'angle3')) return true;
    
    return true;
  };

  // Determine input step and min values based on measurement type
  const getInputProps = (key: string) => {
    if (key.startsWith('angle')) {
      return {
        step: "1",
        min: "1",
        max: "179"
      };
    }
    return {
      step: "0.01",
      min: "0.01"
    };
  };

  return (
    <Card className="w-full bg-white animate-fade-in">
      <CardHeader className="pb-2 flex flex-row items-center space-x-2">
        <ShapeIcon />
        <CardTitle className="text-sm font-medium">
          {shapeName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(measurements).map(([key, value]) => (
            <div key={key} className="flex flex-col">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground cursor-help flex items-center">
                      {t(`measurementLabels.${key}`)}
                      {(key === 'area' || key === 'perimeter' || 
                        (selectedShape.type === 'triangle' && (key === 'height' || key === 'angles' || 
                        key === 'angle1' || key === 'angle2' || key === 'angle3'))) && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-3 w-3 text-muted-foreground"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                      )}
                    </span>
                  </TooltipTrigger>
                  {(key === 'area' || key === 'perimeter' || 
                    (selectedShape.type === 'triangle' && (key === 'height' || key === 'angles' || 
                    key === 'angle1' || key === 'angle2' || key === 'angle3'))) && (
                    <TooltipContent side="top" className="max-w-xs p-4">
                      <div className="space-y-2">
                        <div className="font-medium">{t('formula')}:</div>
                        <div className="katex-formula">
                          <InlineMath math={getFormula(selectedShape.type, key, language)} />
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {t(`formulaExplanations.${selectedShape.type}.${key}`)}
                        </div>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              
              {editingKey === key ? (
                <div className="flex items-center space-x-1 mt-1">
                  <Input
                    className="h-6 text-sm"
                    value={editValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyPress}
                    autoFocus
                    type="number"
                    {...getInputProps(key)}
                  />
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={handleSaveEdit}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><polyline points="20 6 9 17 4 12"></polyline></svg>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6" 
                      onClick={handleCancelEdit}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </Button>
                  </div>
                </div>
              ) : (
                <div 
                  className={`measurement-value font-medium ${isEditable(key) ? 'cursor-pointer hover:text-geometry-primary' : ''}`}
                  onClick={() => isEditable(key) && handleStartEdit(key, formatValue(key, value))}
                >
                  {formatValue(key, value)} {t(`unitSuffixes.${key}`, { unit: measurementUnit })}
                  {isEditable(key) && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-1 h-3 w-3 text-muted-foreground"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MeasurementPanel;
