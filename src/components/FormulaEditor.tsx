import React, { useState, useEffect } from 'react';
import { Formula, FormulaExample } from '@/types/formula';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PlusCircle, Trash2, BookOpen, ZoomIn, ZoomOut, Palette } from 'lucide-react';
import { MeasurementUnit } from '@/types/shapes';
import { getFormulaExamples, createDefaultFormula } from '@/utils/formulaUtils';
import { useTranslate } from '@/utils/translate';
import { Slider } from '@/components/ui/slider';

interface FormulaEditorProps {
  formulas: Formula[];
  onAddFormula: (formula: Formula) => void;
  onUpdateFormula: (id: string, updates: Partial<Formula>) => void;
  onDeleteFormula: (id: string) => void;
  measurementUnit: MeasurementUnit;
  isOpen: boolean;
  selectedFormulaId?: string | null;
  onSelectFormula?: (id: string) => void;
}

const FormulaEditor: React.FC<FormulaEditorProps> = ({
  formulas,
  onAddFormula,
  onUpdateFormula,
  onDeleteFormula,
  measurementUnit,
  isOpen,
  selectedFormulaId,
  onSelectFormula
}) => {
  const t = useTranslate();
  const examples = getFormulaExamples();

  // Function to find the selected formula
  const findSelectedFormula = (): Formula | undefined => {
    return formulas.find(f => f.id === selectedFormulaId);
  };

  // Create a new formula
  const handleCreateFormula = () => {
    // Always create function type formulas
    const newFormula = createDefaultFormula('function');
    // Ensure the expression is set
    if (!newFormula.expression) {
      newFormula.expression = 'x*x';
    }
    console.log('Creating new formula:', newFormula);
    onAddFormula(newFormula);
    if (onSelectFormula) {
      onSelectFormula(newFormula.id);
    }
  };

  // Update the formula being edited
  const handleUpdateFormula = (key: keyof Formula, value: string | number | boolean | [number, number]) => {
    if (selectedFormulaId) {
      onUpdateFormula(selectedFormulaId, { [key]: value });
    }
  };

  // Load an example formula
  const handleLoadExample = (example: FormulaExample) => {
    if (selectedFormulaId) {
      // Update the current formula instead of creating a new one
      onUpdateFormula(selectedFormulaId, {
        expression: example.expression,
        xRange: example.xRange
      });
    } else {
      // Create a new formula from the example
      const newFormula = {
        ...createDefaultFormula('function'),
        expression: example.expression,
        xRange: example.xRange
      };
      // Ensure the expression is set
      if (!newFormula.expression) {
        newFormula.expression = 'x*x';
      }
      console.log('Loading example formula:', newFormula);
      onAddFormula(newFormula);
      if (onSelectFormula) {
        onSelectFormula(newFormula.id);
      }
    }
  };

  // Handle scale factor change
  const handleScaleFactorChange = (value: number[]) => {
    if (selectedFormulaId) {
      // Convert from logarithmic slider value to actual scale factor
      // This gives finer control at lower values
      const actualScaleFactor = Math.pow(10, value[0]);
      onUpdateFormula(selectedFormulaId, { scaleFactor: actualScaleFactor });
    }
  };

  // Handle zoom in/out buttons
  const handleZoomIn = () => {
    if (selectedFormulaId) {
      const currentScaleFactor = findSelectedFormula()?.scaleFactor || 1.0;
      const newScaleFactor = Math.min(currentScaleFactor * 1.25, 10);
      onUpdateFormula(selectedFormulaId, { scaleFactor: newScaleFactor });
    }
  };
  
  const handleZoomOut = () => {
    if (selectedFormulaId) {
      const currentScaleFactor = findSelectedFormula()?.scaleFactor || 1.0;
      const newScaleFactor = Math.max(currentScaleFactor / 1.25, 0.001);
      onUpdateFormula(selectedFormulaId, { scaleFactor: newScaleFactor });
    }
  };

  // When the component mounts, select the first formula if any exist and none is selected
  useEffect(() => {
    if (formulas.length > 0 && !selectedFormulaId && onSelectFormula) {
      onSelectFormula(formulas[0].id);
    }
  }, [formulas, selectedFormulaId, onSelectFormula]);

  // Organize examples by category
  const examplesByCategory = examples.reduce((acc, example) => {
    if (!acc[example.category]) {
      acc[example.category] = [];
    }
    acc[example.category].push(example);
    return acc;
  }, {} as Record<string, FormulaExample[]>);

  if (!isOpen) {
    return null;
  }

  // Get the current scale factor
  const currentScaleFactor = findSelectedFormula()?.scaleFactor || 1.0;
  
  // Convert actual scale factor to logarithmic value for the slider
  const logScaleFactor = Math.log10(currentScaleFactor);

  return (
    <Card className="w-full shadow-lg">
      <CardContent className="p-4">
        <div className="grid gap-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {formulas.map((formula) => (
                <Button
                  key={formula.id}
                  variant={formula.id === selectedFormulaId ? "secondary" : "outline"}
                  size="sm"
                  className="flex items-center gap-1 text-xs"
                  onClick={() => onSelectFormula && onSelectFormula(formula.id)}
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: formula.color }}
                  />
                  <span className="max-w-[100px] truncate">
                    {formula.expression ? formula.expression : t('formulaDefault')}
                  </span>
                  {formula.id === selectedFormulaId && (
                    <span 
                      className="ml-1 opacity-70 hover:opacity-100 text-destructive cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFormula(formula.id);
                        // Select the next formula if available
                        const remainingFormulas = formulas.filter(f => f.id !== formula.id);
                        if (remainingFormulas.length > 0 && onSelectFormula) {
                          onSelectFormula(remainingFormulas[0].id);
                        }
                      }}
                      title={t('deleteFormulaTooltip')}
                    >
                      <Trash2 size={14} />
                    </span>
                  )}
                </Button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCreateFormula}
                className="flex items-center gap-1"
              >
                <PlusCircle size={14} />
                {t('newFormula')}
              </Button>
            </div>
          </div>

          {selectedFormulaId && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Expression Input */}
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Input 
                    id="formula-expression"
                    value={findSelectedFormula()?.expression ?? t('formulaPlaceholder')}
                    onChange={(e) => handleUpdateFormula('expression', e.target.value)}
                    placeholder={t('formulaPlaceholder')}
                    className="pr-10"
                  />
                  <Popover>
                    <PopoverTrigger asChild>
                      <button 
                        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100"
                        type="button"
                        title={t('browseExamples')}
                      >
                        <BookOpen size={16} />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 max-h-96 overflow-y-auto p-0" align="end">
                      <div className="p-4 space-y-4">
                        {Object.entries(examplesByCategory).map(([category, categoryExamples]) => (
                          <div key={category}>
                            <h3 className="font-medium mb-2 capitalize text-sm">{t(`categories.${category}`)}</h3>
                            <div className="space-y-1">
                              {categoryExamples.map((example) => (
                                <div 
                                  key={example.name} 
                                  className="flex items-center p-2 hover:bg-muted rounded-md cursor-pointer"
                                  onClick={() => handleLoadExample(example)}
                                >
                                  <div className="flex-1">
                                    <div className="font-medium text-sm">{example.name}</div>
                                    <div className="text-xs text-muted-foreground">{example.description}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Color Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-9 w-9 relative"
                    title={t('colorPicker')}
                  >
                    <div 
                      className="absolute inset-0 m-2 rounded-sm" 
                      style={{ backgroundColor: findSelectedFormula()?.color || '#ff0000' }}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input 
                        id="formula-color" 
                        type="color" 
                        value={findSelectedFormula()?.color || '#ff0000'}
                        onChange={(e) => handleUpdateFormula('color', e.target.value)}
                        className="w-8 h-8 p-0 border-0"
                      />
                      <Input 
                        id="formula-color-text" 
                        type="text" 
                        value={findSelectedFormula()?.color || '#ff0000'}
                        onChange={(e) => handleUpdateFormula('color', e.target.value)}
                        className="w-24 h-8"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {/* Scale Factor Control */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 px-2 flex items-center gap-1"
                    title={t('scaleFactor')}
                  >
                    <ZoomIn size={14} />
                    <span className="text-xs">
                      {currentScaleFactor < 0.01 
                        ? currentScaleFactor.toFixed(3) 
                        : currentScaleFactor.toFixed(2)}x
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">{t('scaleFactor')}</span>
                      <span className="text-xs text-muted-foreground">
                        {currentScaleFactor < 0.01 
                          ? currentScaleFactor.toFixed(3) 
                          : currentScaleFactor.toFixed(2)}x
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7" 
                        onClick={handleZoomOut}
                      >
                        <ZoomOut size={14} />
                      </Button>
                      <Slider
                        defaultValue={[logScaleFactor]}
                        min={-3} // 10^-3 = 0.001
                        max={1}  // 10^1 = 10
                        step={0.01}
                        onValueChange={handleScaleFactorChange}
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7" 
                        onClick={handleZoomIn}
                      >
                        <ZoomIn size={14} />
                      </Button>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>0.001x</span>
                      <span>1.0x</span>
                      <span>10x</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t('scaleFactorHint')}
                    </p>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FormulaEditor;
