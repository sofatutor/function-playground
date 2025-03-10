import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Formula, FormulaExample } from '@/types/formula';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PlusCircle, Trash2, BookOpen, ZoomIn, ZoomOut, Palette, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { MeasurementUnit } from '@/types/shapes';
import { getFormulaExamples, createDefaultFormula, validateFormula } from '@/utils/formulaUtils';
import { useTranslate } from '@/utils/translate';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { convertNaturalLanguageToExpression } from '@/services/openaiService';
import { toast } from 'sonner';
import { useConfig } from '@/context/ConfigContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FormulaEditorProps {
  formulas: Formula[];
  onAddFormula: (formula: Formula) => void;
  onUpdateFormula: (id: string, updates: Partial<Formula>) => void;
  onDeleteFormula: (id: string) => void;
  measurementUnit: MeasurementUnit;
  isOpen: boolean;
  selectedFormulaId?: string | null;
  onSelectFormula?: (id: string) => void;
  onNewFormula?: () => void;
}

const FormulaEditor: React.FC<FormulaEditorProps> = ({
  formulas,
  onAddFormula,
  onUpdateFormula,
  onDeleteFormula,
  measurementUnit,
  isOpen,
  selectedFormulaId,
  onSelectFormula,
  onNewFormula
}) => {
  const t = useTranslate();
  const { openaiApiKey } = useConfig();
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isNaturalLanguageOpen, setIsNaturalLanguageOpen] = useState(false);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string | null>>({});
  const isMobile = useIsMobile();
  const formulaInputRef = useRef<HTMLInputElement>(null);
  const examples = getFormulaExamples();
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Debounced validation function
  const debouncedValidate = useCallback((formula: Formula) => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    validationTimeoutRef.current = setTimeout(() => {
      const validation = validateFormula(formula);
      if (!validation.isValid) {
        console.error(`Formula validation error: ${validation.error}`);
      }
      setValidationErrors(prev => ({
        ...prev,
        [formula.id]: validation.isValid ? null : validation.error
      }));
    }, 500); // 500ms debounce
  }, []);

  // Update the formula being edited
  const handleUpdateFormula = (key: keyof Formula, value: string | number | boolean | [number, number]) => {
    if (!selectedFormulaId) return;
    
    // Update the formula
    onUpdateFormula(selectedFormulaId, { [key]: value });
    
    // If updating the expression or type, validate with debounce
    if (key === 'expression' || key === 'type') {
      const updatedFormula = {
        ...findSelectedFormula()!,
        [key]: value
      };
      
      debouncedValidate(updatedFormula);
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
    // Close the examples popover after selection
    setExamplesOpen(false);
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

  // Validate formulas when they change, but with debounce
  useEffect(() => {
    formulas.forEach(formula => {
      debouncedValidate(formula);
    });

    // Cleanup timeouts on unmount
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [formulas, debouncedValidate]);

  // Organize examples by category
  const examplesByCategory = getFormulaExamples().reduce((acc, example) => {
    if (!acc[example.category]) {
      acc[example.category] = [];
    }
    acc[example.category].push(example);
    return acc;
  }, {} as Record<string, FormulaExample[]>);

  // Convert JavaScript expression to LaTeX
  const toLatex = (expr: string): string => {
    if (!expr) return '';
    
    return expr
      .replace(/Math\.PI/g, '\\pi')
      .replace(/Math\.E/g, 'e')
      .replace(/Math\.sin\(([^)]+)\)/g, '\\sin($1)')
      .replace(/Math\.cos\(([^)]+)\)/g, '\\cos($1)')
      .replace(/Math\.tan\(([^)]+)\)/g, '\\tan($1)')
      .replace(/Math\.sqrt\(([^)]+)\)/g, '\\sqrt{$1}')
      .replace(/Math\.abs\(([^)]+)\)/g, '|$1|')
      .replace(/Math\.pow\(([^,]+),\s*([^)]+)\)/g, '{$1}^{$2}')
      .replace(/Math\.log\(([^)]+)\)/g, '\\ln($1)')
      .replace(/Math\.exp\(([^)]+)\)/g, 'e^{$1}')
      .replace(/([0-9a-zA-Z.]+)\s*\*\*\s*([0-9a-zA-Z.]+)/g, '{$1}^{$2}')
      .replace(/([0-9a-zA-Z.]+)\s*\*\s*([0-9a-zA-Z.]+)/g, '$1 \\cdot $2')
      .replace(/\//g, '\\div ')
      .replace(/\+/g, ' + ')
      .replace(/-/g, ' - ')
      .replace(/x/g, 'x');
  };

  if (!isOpen) {
    return null;
  }

  // Get the current scale factor
  const currentScaleFactor = findSelectedFormula()?.scaleFactor || 1.0;
  
  // Convert actual scale factor to logarithmic value for the slider
  const logScaleFactor = Math.log10(currentScaleFactor);

  return (
    <Card className={`w-full shadow-lg ${isMobile ? 'p-0 m-0 border-0 shadow-none' : ''}`}>
      <CardContent className={`${isMobile ? 'p-0.5' : 'p-0.5 sm:p-1 md:p-2 lg:p-4'}`}>
        <div className="grid gap-1 sm:gap-2 md:gap-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2">
            {/* Formula buttons - Use responsive grid layout for all screen sizes */}
            <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-1 w-full max-w-full ${isMobile ? 'gap-0.5' : ''}`}>
              {formulas.map((formula) => (
                <div key={formula.id} className="flex flex-col">
                  <Button
                    variant={formula.id === selectedFormulaId ? "secondary" : "outline"}
                    size="sm"
                    className={`flex items-center gap-1 text-[10px] sm:text-xs h-8 sm:h-7 px-2 min-w-0 flex-shrink-0 touch-manipulation ${validationErrors[formula.id] ? 'border-red-500' : ''}`}
                    onClick={() => onSelectFormula && onSelectFormula(formula.id)}
                  >
                    <div 
                      className="w-3 h-3 sm:w-2 sm:h-2 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: formula.color }}
                    />
                    <span className="max-w-[100px] sm:max-w-[120px] md:max-w-[160px] whitespace-nowrap overflow-visible">
                      {formula.expression ? (
                        <InlineMath math={toLatex(formula.expression)} />
                      ) : (
                        t('formulaDefault')
                      )}
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
                </div>
              ))}
              
              {/* Add New Formula button - Make it fit the grid layout */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 w-full sm:h-7 bg-white/80 backdrop-blur-sm flex-shrink-0 col-span-2 md:col-span-1 flex items-center justify-center gap-1"
                      onClick={onNewFormula || handleCreateFormula}
                    >
                      <PlusCircle className="h-4 w-4" />
                      <span className="hidden md:inline">{t('newFormula')}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('newFormula')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="flex gap-1 sm:gap-2 flex-shrink-0 w-full sm:w-auto">
              {/* Delete Formula Button - Removed */}
            </div>
          </div>

          {selectedFormulaId && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-4">
              {/* Expression Input */}
              <div className="w-full col-span-1 md:col-span-2">
                <div className="relative">
                  <Input
                    id="formula-expression"
                    ref={formulaInputRef}
                    value={findSelectedFormula()?.expression || ''}
                    onChange={(e) => handleUpdateFormula('expression', e.target.value)}
                    placeholder={t('enterFormula')}
                    className={`pr-16 h-8 sm:h-10 text-xs sm:text-sm ${validationErrors[selectedFormulaId] ? 'border-red-500' : ''}`}
                  />
                  <div className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 flex gap-1">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1 sm:gap-2">
                        <div className="flex items-center gap-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <button 
                                className="opacity-70 hover:opacity-100"
                                type="button"
                                title={t('naturalLanguage')}
                              >
                                <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[95vw] sm:w-[500px] md:w-[600px] lg:w-[700px] p-0" align="end" side="bottom">
                              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                                <Textarea 
                                  placeholder={t('naturalLanguagePlaceholder')}
                                  className="text-xs sm:text-sm h-24 sm:h-32"
                                  value={naturalLanguageInput}
                                  onChange={(e) => setNaturalLanguageInput(e.target.value)}
                                />
                                <Button 
                                  size="sm" 
                                  className="w-full h-7 sm:h-8 text-xs sm:text-sm"
                                  onClick={handleNaturalLanguageConversion}
                                  disabled={isProcessing || !openaiApiKey}
                                >
                                  {isProcessing ? (
                                    <>
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                      {t('processing')}
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="h-4 w-4 mr-2" />
                                      {t('naturalLanguageGenerate')}
                                    </>
                                  )}
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <Popover open={examplesOpen} onOpenChange={setExamplesOpen}>
                            <PopoverTrigger asChild>
                              <button 
                                className="opacity-70 hover:opacity-100"
                                type="button"
                                title={t('browseExamples')}
                              >
                                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[95vw] sm:w-[500px] md:w-[600px] lg:w-[700px] max-h-60 sm:max-h-80 overflow-y-auto p-0" align="end" side="bottom">
                              <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
                                {Object.entries(examplesByCategory).map(([category, categoryExamples]) => (
                                  <div key={category}>
                                    <h3 className="font-medium mb-1 capitalize text-xs sm:text-sm">{t(`categories.${category}`)}</h3>
                                    <div className="space-y-1">
                                      {categoryExamples.map((example) => (
                                        <div 
                                          key={example.name} 
                                          className="flex items-center p-1.5 hover:bg-muted rounded-md cursor-pointer"
                                          onClick={() => handleLoadExample(example)}
                                        >
                                          <div className="flex-1">
                                            <div className="font-medium text-xs sm:text-sm">{example.name}</div>
                                            <div className="text-[10px] sm:text-xs text-muted-foreground">{example.description}</div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                          
                          {/* Color Picker - Moved here */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <button 
                                className="opacity-70 hover:opacity-100 relative"
                                type="button"
                                title={t('colorPicker')}
                              >
                                <div 
                                  className="absolute inset-0 m-0.5 rounded-sm" 
                                  style={{ backgroundColor: findSelectedFormula()?.color || '#ff0000' }}
                                />
                                <Palette className="h-3 w-3 sm:h-4 sm:w-4 text-transparent" />
                              </button>
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
                          
                          {/* Scale Factor Control - Moved here */}
                          <Popover>
                            <PopoverTrigger asChild>
                              <button 
                                className="opacity-70 hover:opacity-100 flex items-center"
                                type="button"
                                title={t('scaleFactor')}
                              >
                                <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-1 sm:p-2">
                              <div className="space-y-1 sm:space-y-2">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-5 w-5 sm:h-6 sm:w-6"
                                    onClick={handleZoomOut}
                                  >
                                    <ZoomOut className="h-2 w-2 sm:h-3 sm:w-3" />
                                  </Button>
                                  <div className="flex-1 min-w-[100px] sm:min-w-[120px]">
                                    <Slider 
                                      value={[logScaleFactor]} 
                                      min={-3} 
                                      max={1} 
                                      step={0.01} 
                                      onValueChange={handleScaleFactorChange}
                                    />
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="icon" 
                                    className="h-5 w-5 sm:h-6 sm:w-6"
                                    onClick={handleZoomIn}
                                  >
                                    <ZoomIn className="h-2 w-2 sm:h-3 sm:w-3" />
                                  </Button>
                                </div>
                                <div className="text-center text-[10px] sm:text-xs">
                                  {currentScaleFactor < 0.01 
                                    ? currentScaleFactor.toFixed(3) 
                                    : currentScaleFactor.toFixed(2)}x
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FormulaEditor;
