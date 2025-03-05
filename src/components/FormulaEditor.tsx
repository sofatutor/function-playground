import React, { useState, useEffect } from 'react';
import { Formula, FormulaExample } from '@/types/formula';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FunctionSquare, PlusCircle, Trash2, BookOpen, ZoomIn, ZoomOut } from 'lucide-react';
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
}

const FormulaEditor: React.FC<FormulaEditorProps> = ({
  formulas,
  onAddFormula,
  onUpdateFormula,
  onDeleteFormula,
  measurementUnit,
  isOpen
}) => {
  const [editingFormulaId, setEditingFormulaId] = useState<string | null>(null);
  
  const t = useTranslate();
  const examples = getFormulaExamples();

  // Function to find the formula being edited
  const findEditingFormula = (): Formula | undefined => {
    return formulas.find(f => f.id === editingFormulaId);
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
    setEditingFormulaId(newFormula.id);
  };

  // Update the formula being edited
  const handleUpdateFormula = (key: keyof Formula, value: string | number | boolean | [number, number]) => {
    if (editingFormulaId) {
      onUpdateFormula(editingFormulaId, { [key]: value });
    }
  };

  // Load an example formula
  const loadExample = (example: FormulaExample) => {
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
    setEditingFormulaId(newFormula.id);
  };

  // When the component mounts, select the first formula if any exist
  useEffect(() => {
    if (formulas.length > 0 && !editingFormulaId) {
      setEditingFormulaId(formulas[0].id);
    }
  }, [formulas, editingFormulaId]);

  // Handle scale factor change
  const handleScaleFactorChange = (value: number[]) => {
    if (editingFormulaId) {
      // Convert from logarithmic slider value to actual scale factor
      // This gives finer control at lower values
      const actualScaleFactor = Math.pow(10, value[0]);
      onUpdateFormula(editingFormulaId, { scaleFactor: actualScaleFactor });
    }
  };

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

  // Get the current scale factor of the editing formula
  const currentScaleFactor = findEditingFormula()?.scaleFactor || 1.0;
  
  // Convert actual scale factor to logarithmic value for the slider
  const logScaleFactor = Math.log10(currentScaleFactor);

  return (
    <Card className="w-full shadow-lg">
      <CardContent className="p-4">
        <div className="grid gap-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              {formulas.map((formula) => (
                <Button
                  key={formula.id}
                  variant={formula.id === editingFormulaId ? "secondary" : "outline"}
                  size="sm"
                  className="flex items-center gap-1 text-xs"
                  onClick={() => setEditingFormulaId(formula.id)}
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: formula.color }}
                  />
                  <span className="max-w-[100px] truncate">
                    {formula.expression ? formula.expression : t('formulaDefault')}
                  </span>
                  {formula.id === editingFormulaId && (
                    <span 
                      className="ml-1 opacity-70 hover:opacity-100 text-destructive cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteFormula(formula.id);
                        // Select the next formula if available
                        const remainingFormulas = formulas.filter(f => f.id !== formula.id);
                        setEditingFormulaId(remainingFormulas.length > 0 ? remainingFormulas[0].id : null);
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

          {editingFormulaId && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-2">
                <div className="md:col-span-8">
                  <Label htmlFor="formula-expression">{t('functionExpression')}</Label>
                  <div className="relative">
                    <Input 
                      id="formula-expression"
                      value={findEditingFormula()?.expression ?? t('formulaPlaceholder')}
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
                                    onClick={() => {
                                      if (editingFormulaId) {
                                        // Update the current formula instead of creating a new one
                                        handleUpdateFormula('expression', example.expression);
                                      } else {
                                        loadExample(example);
                                      }
                                    }}
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
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('functionExpressionHint')}
                  </p>
                </div>

                <div className="md:col-span-4">
                  <Label htmlFor="formula-color">{t('color')}</Label>
                  <div className="relative w-full">
                    <Input 
                      id="formula-color-text" 
                      type="text" 
                      value={findEditingFormula()?.color || '#ff0000'}
                      onChange={(e) => handleUpdateFormula('color', e.target.value)}
                      className="pl-10"
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2">
                      <Input 
                        id="formula-color" 
                        type="color" 
                        value={findEditingFormula()?.color || '#ff0000'}
                        onChange={(e) => handleUpdateFormula('color', e.target.value)}
                        className="w-6 h-6 p-0 border-0"
                        title={t('colorPicker')}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Scale Factor Slider */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="scale-factor">{t('scaleFactor')}</Label>
                  <span className="text-xs text-muted-foreground">
                    {currentScaleFactor < 0.01 
                      ? currentScaleFactor.toFixed(3) 
                      : currentScaleFactor.toFixed(2)}x
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <ZoomOut size={16} className="text-muted-foreground" />
                  <Slider
                    id="scale-factor"
                    defaultValue={[logScaleFactor]}
                    min={-3} // 10^-3 = 0.001
                    max={1}  // 10^1 = 10
                    step={0.01}
                    onValueChange={handleScaleFactorChange}
                    className="flex-1"
                  />
                  <ZoomIn size={16} className="text-muted-foreground" />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{t('scaleMin')}</span>
                  <span>{t('scaleDefault')}</span>
                  <span>{t('scaleMax')}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('scaleFactorHint')}
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FormulaEditor;
