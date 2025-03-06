import React, { useState, useEffect } from 'react';
import { Formula, FormulaExample } from '@/types/formula';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PlusCircle, Trash2, BookOpen, ZoomIn, ZoomOut, Palette, Sparkles, Loader2 } from 'lucide-react';
import { MeasurementUnit } from '@/types/shapes';
import { getFormulaExamples, createDefaultFormula } from '@/utils/formulaUtils';
import { useTranslate } from '@/utils/translate';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { convertNaturalLanguageToExpression } from '@/services/openaiService';
import { toast } from 'sonner';
import { useConfig } from '@/context/ConfigContext';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const { openaiApiKey } = useConfig();
  const examples = getFormulaExamples();
  const [isNaturalLanguageOpen, setIsNaturalLanguageOpen] = useState(false);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const isMobile = useIsMobile();

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

  // Handle natural language conversion
  const handleNaturalLanguageConversion = async () => {
    if (!naturalLanguageInput.trim()) {
      toast.error(t('naturalLanguageEmpty'));
      return;
    }

    setIsProcessing(true);
    try {
      const result = await convertNaturalLanguageToExpression(naturalLanguageInput, openaiApiKey);
      
      if (selectedFormulaId) {
        // Update the current formula
        onUpdateFormula(selectedFormulaId, {
          expression: result.expression
        });
        toast.success(t('naturalLanguageSuccess'), {
          description: result.explanation
        });
      } else {
        // Create a new formula with the generated expression
        const newFormula = {
          ...createDefaultFormula('function'),
          expression: result.expression
        };
        onAddFormula(newFormula);
        if (onSelectFormula) {
          onSelectFormula(newFormula.id);
        }
        toast.success(t('naturalLanguageSuccess'), {
          description: result.explanation
        });
      }
      
      // Close the popover and reset the input
      setIsNaturalLanguageOpen(false);
      setNaturalLanguageInput('');
    } catch (error) {
      console.error('Error converting natural language:', error);
      toast.error(t('naturalLanguageError'));
    } finally {
      setIsProcessing(false);
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
      <CardContent className="p-0.5 sm:p-1 md:p-2 lg:p-4">
        <div className="grid gap-1 sm:gap-2 md:gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
            <div className="flex gap-1 overflow-x-auto pb-1 w-full max-w-full no-scrollbar">
              {formulas.map((formula) => (
                <Button
                  key={formula.id}
                  variant={formula.id === selectedFormulaId ? "secondary" : "outline"}
                  size="sm"
                  className="flex items-center gap-1 text-[10px] sm:text-xs h-6 sm:h-7 px-1 sm:px-2 min-w-0 flex-shrink-0"
                  onClick={() => onSelectFormula && onSelectFormula(formula.id)}
                >
                  <div 
                    className="w-2 h-2 sm:w-2 sm:h-2 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: formula.color }}
                  />
                  <span className="max-w-[40px] sm:max-w-[60px] md:max-w-[80px] truncate">
                    {formula.expression ? formula.expression : t('formulaDefault')}
                  </span>
                  {formula.id === selectedFormulaId && (
                    <span 
                      className="ml-1 opacity-70 hover:opacity-100 text-destructive cursor-pointer flex-shrink-0"
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
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    </span>
                  )}
                </Button>
              ))}
            </div>
            <div className="flex gap-1 sm:gap-2 flex-shrink-0 w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleCreateFormula}
                className="flex items-center gap-1 h-6 sm:h-7 text-[10px] sm:text-xs px-1 sm:px-2 w-full sm:w-auto"
              >
                <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                {t('newFormula')}
              </Button>
            </div>
          </div>

          {selectedFormulaId && (
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-1 sm:gap-2">
              {/* Expression Input */}
              <div className="flex-1 min-w-[150px] sm:min-w-[200px] w-full sm:w-auto">
                <div className="relative">
                  <Input 
                    id="formula-expression"
                    value={findSelectedFormula()?.expression ?? t('formulaPlaceholder')}
                    onChange={(e) => handleUpdateFormula('expression', e.target.value)}
                    placeholder={t('formulaPlaceholder')}
                    className="pr-12 sm:pr-16 h-7 sm:h-8 text-[10px] sm:text-xs"
                  />
                  <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <Popover open={isNaturalLanguageOpen} onOpenChange={setIsNaturalLanguageOpen}>
                      <PopoverTrigger asChild>
                        <button 
                          className="opacity-70 hover:opacity-100"
                          type="button"
                          title={t('naturalLanguageTooltip')}
                        >
                          <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] sm:w-[250px] md:w-[280px] p-2 sm:p-3" align="end">
                        <div className="space-y-2 sm:space-y-3">
                          <h3 className="font-medium text-[10px] sm:text-xs">{t('naturalLanguageTitle')}</h3>
                          <Textarea
                            placeholder={t('naturalLanguagePlaceholder')}
                            value={naturalLanguageInput}
                            onChange={(e) => setNaturalLanguageInput(e.target.value)}
                            className="min-h-[60px] sm:min-h-[80px] text-[10px] sm:text-xs"
                          />
                          <div className="text-[8px] sm:text-[10px] text-muted-foreground">
                            {t('naturalLanguageDescription')}
                          </div>
                          <Button 
                            onClick={handleNaturalLanguageConversion}
                            disabled={isProcessing || !naturalLanguageInput.trim()}
                            className="w-full h-6 sm:h-8 text-[10px] sm:text-xs"
                          >
                            {isProcessing ? (
                              <>
                                <Loader2 className="h-3 w-3 mr-1 animate-spin sm:h-4 sm:w-4 sm:mr-2" />
                                {t('naturalLanguageProcessing')}
                              </>
                            ) : (
                              <>
                                <Sparkles className="h-3 w-3 mr-1 sm:h-4 sm:w-4 sm:mr-2" />
                                {t('naturalLanguageGenerate')}
                              </>
                            )}
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button 
                          className="opacity-70 hover:opacity-100"
                          type="button"
                          title={t('browseExamples')}
                        >
                          <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[200px] sm:w-[250px] md:w-[280px] max-h-60 sm:max-h-80 overflow-y-auto p-0" align="end">
                        <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
                          {Object.entries(examplesByCategory).map(([category, categoryExamples]) => (
                            <div key={category}>
                              <h3 className="font-medium mb-1 capitalize text-[10px] sm:text-xs">{t(`categories.${category}`)}</h3>
                              <div className="space-y-1">
                                {categoryExamples.map((example) => (
                                  <div 
                                    key={example.name} 
                                    className="flex items-center p-1 hover:bg-muted rounded-md cursor-pointer"
                                    onClick={() => handleLoadExample(example)}
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium text-[10px] sm:text-xs">{example.name}</div>
                                      <div className="text-[8px] sm:text-[10px] text-muted-foreground">{example.description}</div>
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
              </div>

              {/* Controls Row */}
              <div className="flex flex-wrap gap-1 sm:gap-2 w-full sm:w-auto">
                {/* Color Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-7 w-7 sm:h-8 sm:w-8 relative flex-shrink-0"
                      title={t('colorPicker')}
                    >
                      <div 
                        className="absolute inset-0 m-1 sm:m-2 rounded-sm" 
                        style={{ backgroundColor: findSelectedFormula()?.color || '#ff0000' }}
                      />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-1 sm:p-2">
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex items-center gap-1">
                        <Input 
                          id="formula-color" 
                          type="color" 
                          value={findSelectedFormula()?.color || '#ff0000'}
                          onChange={(e) => handleUpdateFormula('color', e.target.value)}
                          className="w-5 h-5 sm:w-6 sm:h-6 p-0 border-0"
                        />
                        <Input 
                          id="formula-color-text" 
                          type="text" 
                          value={findSelectedFormula()?.color || '#ff0000'}
                          onChange={(e) => handleUpdateFormula('color', e.target.value)}
                          className="w-16 sm:w-20 h-6 sm:h-7 text-[10px] sm:text-xs"
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
                      className="h-7 sm:h-8 px-1 sm:px-2 flex items-center gap-1 flex-shrink-0"
                      title={t('scaleFactor')}
                    >
                      <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="text-[10px] sm:text-xs">
                        {currentScaleFactor < 0.01 
                          ? currentScaleFactor.toFixed(3) 
                          : currentScaleFactor.toFixed(2)}x
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 sm:w-56 p-2 sm:p-3">
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] sm:text-xs font-medium">{t('scaleFactor')}</span>
                        <span className="text-[8px] sm:text-[10px] text-muted-foreground">
                          {currentScaleFactor < 0.01 
                            ? currentScaleFactor.toFixed(3) 
                            : currentScaleFactor.toFixed(2)}x
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-5 w-5 sm:h-6 sm:w-6" 
                          onClick={handleZoomOut}
                        >
                          <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
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
                          className="h-5 w-5 sm:h-6 sm:w-6" 
                          onClick={handleZoomIn}
                        >
                          <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                      <div className="flex justify-between text-[8px] sm:text-[10px] text-muted-foreground mt-1">
                        <span>0.001x</span>
                        <span>1.0x</span>
                        <span>10x</span>
                      </div>
                      <p className="text-[8px] sm:text-[10px] text-muted-foreground mt-1">
                        {t('scaleFactorHint')}
                      </p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FormulaEditor;
