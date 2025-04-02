import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Formula, FormulaExample } from '@/types/formula';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Trash2, BookOpen, ZoomIn, ZoomOut, Sparkles, Loader2, AlertCircle, ChevronLeftIcon, ChevronRightIcon, Settings } from 'lucide-react';
import { MeasurementUnit } from '@/types/shapes';
import { getFormulaExamples, createDefaultFormula, validateFormula, convertToLatex } from '@/utils/formulaUtils';
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
import { detectParameters } from '@/utils/parameterDetection';

interface FormulaEditorProps {
  formulas: Formula[];
  onAddFormula: (formula: Formula) => void;
  onUpdateFormula: (id: string, updates: Partial<Formula>) => void;
  onDeleteFormula: (id: string) => void;
  _measurementUnit: MeasurementUnit;
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
  _measurementUnit,
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
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string | null>>({});
  const _isMobile = useIsMobile();
  const formulaInputRef = useRef<HTMLInputElement>(null);
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
  const handleUpdateFormula = (key: keyof Formula, value: string | number | boolean | [number, number] | Record<string, number>) => {
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

  const handleLoadExample = (example: FormulaExample) => {
    if (selectedFormulaId) {
      // Update existing formula
      onUpdateFormula(selectedFormulaId, {
        expression: example.expression
      });
    } else {
      // Create new formula from example
      const newFormula = createDefaultFormula('function');
      newFormula.expression = example.expression;
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

  if (!isOpen) {
    return null;
  }

  // Get the current scale factor
  const currentScaleFactor = findSelectedFormula()?.scaleFactor || 1.0;
  
  return (
    <div 
      className="w-full px-1 sm:px-2" 
      id="formula-editor"
      data-testid="formula-editor"
    >
      <div 
        className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full" 
        id="formula-editor-toolbar"
      >
        {/* Formula Input Section - Full Width */}
        <div className="flex-grow w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <Input
              ref={formulaInputRef}
              id="formula-expression-input"
              data-testid="formula-expression-input"
              type="text"
              placeholder={t('enterFormula')}
              value={findSelectedFormula()?.expression || ''}
              onChange={(e) => handleUpdateFormula('expression', e.target.value)}
              className="flex-grow font-mono"
            />
            
            {/* Show validation error if any */}
            {selectedFormulaId && validationErrors[selectedFormulaId] && (
              <Alert variant="destructive" className="p-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {validationErrors[selectedFormulaId]}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>

        {/* Controls Section - Row on Mobile, Buttons on Desktop */}
        <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
          {/* Function Navigation Buttons - Only show if multiple formulas exist */}
          {formulas.length > 1 && (
            <>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => {
                        const currentIndex = formulas.findIndex((f) => f.id === selectedFormulaId);
                        const prevIndex = currentIndex === 0 ? formulas.length - 1 : currentIndex - 1;
                        onSelectFormula?.(formulas[prevIndex].id);
                      }}
                    >
                      <ChevronLeftIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('previousFormula')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => {
                        const currentIndex = formulas.findIndex((f) => f.id === selectedFormulaId);
                        const nextIndex = currentIndex === formulas.length - 1 ? 0 : currentIndex + 1;
                        onSelectFormula?.(formulas[nextIndex].id);
                      }}
                    >
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{t('nextFormula')}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}

          {/* Natural Language Input */}
          <Popover open={isNaturalLanguageOpen} onOpenChange={setIsNaturalLanguageOpen}>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      disabled={isProcessing}
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('naturalLanguageButton')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-96">
              <div className="space-y-2">
                <Label>{t('naturalLanguageTitle')}</Label>
                <Textarea
                  placeholder={t('naturalLanguagePlaceholder')}
                  value={naturalLanguageInput}
                  onChange={(e) => setNaturalLanguageInput(e.target.value)}
                />
                <Button 
                  onClick={handleNaturalLanguageConversion}
                  disabled={isProcessing || !openaiApiKey}
                  className="w-full"
                >
                  {isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    t('naturalLanguageGenerate')
                  )}
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Formula Options Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setIsOptionsOpen(true)}
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('formula.optionsTooltip')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Formula Options Dialog */}
          <Dialog open={isOptionsOpen} onOpenChange={setIsOptionsOpen}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader className="pb-2">
                <DialogTitle>{t('formula.options')}</DialogTitle>
                <DialogDescription>
                  {t('formula.description')}
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="general">{t('formula.tabs.general')}</TabsTrigger>
                  <TabsTrigger value="parameters">{t('formula.tabs.parameters')}</TabsTrigger>
                </TabsList>
                
                {/* General Tab */}
                <TabsContent value="general" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="formula-name">{t('formula.name')}</Label>
                    <Input
                      id="formula-name"
                      value={findSelectedFormula()?.name || ''}
                      onChange={(e) => handleUpdateFormula('name', e.target.value)}
                      placeholder={t('formula.untitled')}
                    />
                  </div>
                </TabsContent>
                
                {/* Parameters Tab */}
                <TabsContent value="parameters" className="space-y-4">
                  <div className="space-y-4">
                    {detectParameters(findSelectedFormula()?.expression || '').map((param) => (
                      <div key={param.name} className="space-y-4 p-4 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <Label className="text-base">{param.name}</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              className="w-20"
                              value={findSelectedFormula()?.parameters?.[param.name] ?? param.defaultValue}
                              onChange={(e) => handleUpdateFormula('parameters', {
                                ...(findSelectedFormula()?.parameters || {}),
                                [param.name]: e.target.value ? parseFloat(e.target.value) : param.defaultValue
                              } as Record<string, number>)}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('formula.parameterRange')}</Label>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                              <Label className="text-xs">{t('formula.minValue')}</Label>
                              <Input
                                type="number"
                                value={param.minValue}
                                onChange={(e) => {
                                  const newMinValue = e.target.value ? parseFloat(e.target.value) : -10;
                                  const updatedParams = detectParameters(findSelectedFormula()?.expression || '')
                                    .map(p => p.name === param.name 
                                      ? { ...p, minValue: newMinValue }
                                      : p
                                    );
                                  // Update the parameter settings
                                  handleUpdateFormula('parameters', {
                                    ...(findSelectedFormula()?.parameters || {}),
                                    [param.name]: Math.max(newMinValue, findSelectedFormula()?.parameters?.[param.name] ?? param.defaultValue)
                                  } as Record<string, number>);
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">{t('formula.maxValue')}</Label>
                              <Input
                                type="number"
                                value={param.maxValue}
                                onChange={(e) => {
                                  const newMaxValue = e.target.value ? parseFloat(e.target.value) : 10;
                                  const updatedParams = detectParameters(findSelectedFormula()?.expression || '')
                                    .map(p => p.name === param.name 
                                      ? { ...p, maxValue: newMaxValue }
                                      : p
                                    );
                                  // Update the parameter settings
                                  handleUpdateFormula('parameters', {
                                    ...(findSelectedFormula()?.parameters || {}),
                                    [param.name]: Math.min(newMaxValue, findSelectedFormula()?.parameters?.[param.name] ?? param.defaultValue)
                                  } as Record<string, number>);
                                }}
                              />
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{t('formula.step')}</Label>
                            <Input
                              type="number"
                              value={param.step}
                              onChange={(e) => {
                                const newStep = e.target.value ? parseFloat(e.target.value) : 0.1;
                                const updatedParams = detectParameters(findSelectedFormula()?.expression || '')
                                  .map(p => p.name === param.name 
                                    ? { ...p, step: newStep }
                                    : p
                                  );
                              }}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('formula.quickAdjust')}</Label>
                          <Slider
                            value={[findSelectedFormula()?.parameters?.[param.name] ?? param.defaultValue]}
                            min={param.minValue}
                            max={param.maxValue}
                            step={param.step}
                            onValueChange={(value) => handleUpdateFormula('parameters', {
                              ...(findSelectedFormula()?.parameters || {}),
                              [param.name]: value[0]
                            } as Record<string, number>)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>

          {/* Examples */}
          <Popover open={examplesOpen} onOpenChange={setExamplesOpen}>
            <TooltipProvider>
              <Tooltip>
                <PopoverTrigger asChild>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-9 w-9"
                    >
                      <BookOpen className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                </PopoverTrigger>
                <TooltipContent>
                  <p>{t('browseExamples')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-96 p-2">
              <div className="grid gap-2">
                {Object.entries(examplesByCategory).map(([category, examples]) => (
                  <div key={category} className="space-y-1">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {t(`categories.${category}`)}
                    </Label>
                    <div className="grid gap-0.5 mt-1">
                      {examples.map((example) => (
                        <Button
                          key={example.expression}
                          variant="ghost"
                          className="w-full justify-start text-left h-auto py-1"
                          onClick={() => handleLoadExample(example)}
                        >
                          <InlineMath math={convertToLatex(example.expression)} />
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Scale Factor Control */}
          <Popover>
            <TooltipProvider>
              <Tooltip>
                <PopoverTrigger asChild>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="h-9 w-9"
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                </PopoverTrigger>
                <TooltipContent>
                  <p>{t('scaleFactorHint')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <PopoverContent className="w-96 p-4">
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
                  <ZoomOut size={16} className="text-muted-foreground" />
                  <Slider
                    defaultValue={[Math.log10(currentScaleFactor)]}
                    min={-3} // 10^-3 = 0.001
                    max={1}  // 10^1 = 10
                    step={0.01}
                    onValueChange={handleScaleFactorChange}
                    className="flex-1"
                  />
                  <ZoomIn size={16} className="text-muted-foreground" />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0.001x</span>
                  <span>1.0x</span>
                  <span>10x</span>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Color Picker */}
          <div className="relative">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <input
                      type="color"
                      className="opacity-0 absolute inset-0 w-9 h-9 cursor-pointer"
                      value={findSelectedFormula()?.color || '#000000'}
                      onChange={(e) => handleUpdateFormula('color', e.target.value)}
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 pointer-events-none"
                    >
                      <div 
                        className="w-4 h-4 rounded-sm"
                        style={{ 
                          backgroundColor: findSelectedFormula()?.color || '#000000',
                        }}
                      />
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t('colorPicker')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Delete Formula Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => selectedFormulaId && onDeleteFormula(selectedFormulaId)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('deleteFormula')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Add Formula Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  id="add-formula-button"
                  variant="outline"
                  size="sm"
                  className="mt-1 sm:mt-0"
                  data-testid="add-formula-button"
                  onClick={onNewFormula || handleCreateFormula}
                >
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('newFormula')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};

export default FormulaEditor;
