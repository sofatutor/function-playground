
import React, { useState, useEffect } from 'react';
import { Formula, FormulaType, FormulaExample } from '@/types/formula';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Function, Circle, Sigma, Pi, ChevronDown, XCircle, PlusCircle, Trash2, Eye, EyeOff } from 'lucide-react';
import { MeasurementUnit } from '@/types/shapes';
import { getFormulaExamples, createDefaultFormula } from '@/utils/formulaUtils';
import { useTranslate } from '@/utils/translate';

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
  const [activeTab, setActiveTab] = useState<'editor' | 'examples'>('editor');
  const [selectedType, setSelectedType] = useState<FormulaType>('function');
  const [editingFormulaId, setEditingFormulaId] = useState<string | null>(null);
  
  const t = useTranslate();
  const examples = getFormulaExamples();

  // Function to find the formula being edited
  const findEditingFormula = (): Formula | undefined => {
    return formulas.find(f => f.id === editingFormulaId);
  };

  // Create a new formula
  const handleCreateFormula = () => {
    const newFormula = createDefaultFormula(selectedType);
    onAddFormula(newFormula);
    setEditingFormulaId(newFormula.id);
  };

  // Update the formula being edited
  const handleUpdateFormula = (key: keyof Formula, value: any) => {
    if (editingFormulaId) {
      onUpdateFormula(editingFormulaId, { [key]: value });
    }
  };

  // Toggle visibility of a formula
  const toggleVisibility = (id: string) => {
    const formula = formulas.find(f => f.id === id);
    if (formula) {
      onUpdateFormula(id, { visible: !formula.visible });
    }
  };

  // Load an example formula
  const loadExample = (example: FormulaExample) => {
    const newFormula = {
      ...createDefaultFormula(example.type),
      expression: example.expression,
      xRange: example.xRange,
      tRange: example.tRange
    };
    onAddFormula(newFormula);
    setEditingFormulaId(newFormula.id);
    setActiveTab('editor');
    setSelectedType(example.type);
  };

  // When the component mounts, select the first formula if any exist
  useEffect(() => {
    if (formulas.length > 0 && !editingFormulaId) {
      setEditingFormulaId(formulas[0].id);
      setSelectedType(formulas[0].type);
    }
  }, [formulas, editingFormulaId]);

  // If the editing formula changes, update the selectedType
  useEffect(() => {
    const formula = findEditingFormula();
    if (formula) {
      setSelectedType(formula.type);
    }
  }, [editingFormulaId]);

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

  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Function className="mr-2" size={20} />
          {t('formulaEditor')}
        </CardTitle>
        <CardDescription>
          {t('formulaEditorDescription')}
        </CardDescription>
      </CardHeader>
      
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'editor' | 'examples')}>
        <div className="px-4">
          <TabsList className="w-full mb-2">
            <TabsTrigger value="editor" className="flex-1">
              {t('editor')}
            </TabsTrigger>
            <TabsTrigger value="examples" className="flex-1">
              {t('examples')}
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="p-0">
          <TabsContent value="editor" className="m-0 p-4">
            <div className="grid gap-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-2">
                  {formulas.map((formula) => (
                    <Button
                      key={formula.id}
                      variant={formula.id === editingFormulaId ? "default" : "outline"}
                      size="sm"
                      className="flex items-center gap-1 text-xs"
                      onClick={() => setEditingFormulaId(formula.id)}
                    >
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: formula.color }}
                      />
                      {formula.type === 'function' ? 'f(x)' : 
                       formula.type === 'parametric' ? 'p(t)' : 'r(θ)'}
                      <button 
                        className="ml-1 opacity-70 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVisibility(formula.id);
                        }}
                      >
                        {formula.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </Button>
                  ))}
                </div>
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

              {editingFormulaId && (
                <>
                  <div className="flex flex-wrap gap-4">
                    <div className="w-full md:w-[calc(50%-0.5rem)]">
                      <Label htmlFor="formula-type">{t('formulaType')}</Label>
                      <Select 
                        value={selectedType} 
                        onValueChange={(value) => {
                          setSelectedType(value as FormulaType);
                          // Create a new formula with the selected type
                          if (editingFormulaId) {
                            const defaultFormula = createDefaultFormula(value as FormulaType);
                            onUpdateFormula(editingFormulaId, {
                              type: value as FormulaType,
                              expression: defaultFormula.expression,
                              xRange: defaultFormula.xRange,
                              tRange: defaultFormula.tRange
                            });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="function">
                            <div className="flex items-center">
                              <Function size={16} className="mr-2" />
                              {t('functionYofX')}
                            </div>
                          </SelectItem>
                          <SelectItem value="parametric">
                            <div className="flex items-center">
                              <Circle size={16} className="mr-2" />
                              {t('parametricXYofT')}
                            </div>
                          </SelectItem>
                          <SelectItem value="polar">
                            <div className="flex items-center">
                              <Sigma size={16} className="mr-2" />
                              {t('polarRofTheta')}
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full md:w-[calc(50%-0.5rem)]">
                      <Label htmlFor="formula-color">{t('color')}</Label>
                      <div className="flex gap-2">
                        <Input 
                          id="formula-color" 
                          type="color" 
                          value={findEditingFormula()?.color || '#ff0000'}
                          onChange={(e) => handleUpdateFormula('color', e.target.value)}
                          className="w-12 h-10 p-1"
                        />
                        <Input 
                          type="text" 
                          value={findEditingFormula()?.color || '#ff0000'}
                          onChange={(e) => handleUpdateFormula('color', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="formula-expression">
                      {selectedType === 'function' 
                        ? t('functionExpression') 
                        : selectedType === 'parametric' 
                          ? t('parametricExpression') 
                          : t('polarExpression')}
                    </Label>
                    <Input 
                      id="formula-expression"
                      value={findEditingFormula()?.expression || ''}
                      onChange={(e) => handleUpdateFormula('expression', e.target.value)}
                      placeholder={
                        selectedType === 'function' 
                          ? 'x*x' 
                          : selectedType === 'parametric' 
                            ? 'Math.cos(t); Math.sin(t)' 
                            : 'Math.cos(3 * theta)'
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedType === 'function' 
                        ? t('functionExpressionHint')
                        : selectedType === 'parametric' 
                          ? t('parametricExpressionHint')
                          : t('polarExpressionHint')}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-4">
                    <div className="w-full md:w-[calc(50%-0.5rem)]">
                      <Label htmlFor="formula-strokeWidth">{t('strokeWidth')}</Label>
                      <div className="flex items-center gap-2">
                        <Slider 
                          id="formula-strokeWidth"
                          min={1}
                          max={10}
                          step={1}
                          value={[findEditingFormula()?.strokeWidth || 2]}
                          onValueChange={(value) => handleUpdateFormula('strokeWidth', value[0])}
                          className="flex-1"
                        />
                        <span className="w-8 text-center">
                          {findEditingFormula()?.strokeWidth || 2}
                        </span>
                      </div>
                    </div>

                    <div className="w-full md:w-[calc(50%-0.5rem)]">
                      <Label htmlFor="formula-samples">{t('samples')}</Label>
                      <div className="flex items-center gap-2">
                        <Slider 
                          id="formula-samples"
                          min={100}
                          max={1000}
                          step={50}
                          value={[findEditingFormula()?.samples || 200]}
                          onValueChange={(value) => handleUpdateFormula('samples', value[0])}
                          className="flex-1"
                        />
                        <span className="w-10 text-center">
                          {findEditingFormula()?.samples || 200}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Range controls */}
                  <div className="flex flex-wrap gap-4">
                    <div className="w-full md:w-[calc(50%-0.5rem)]">
                      <Label htmlFor="formula-xmin">{t('xRange')}</Label>
                      <div className="flex items-center gap-2">
                        <Input 
                          id="formula-xmin"
                          type="number"
                          value={findEditingFormula()?.xRange[0] || -10}
                          onChange={(e) => {
                            const formula = findEditingFormula();
                            if (formula) {
                              const newXRange: [number, number] = [
                                parseFloat(e.target.value) || -10,
                                formula.xRange[1]
                              ];
                              handleUpdateFormula('xRange', newXRange);
                            }
                          }}
                          className="w-24"
                        />
                        <span>to</span>
                        <Input 
                          id="formula-xmax"
                          type="number"
                          value={findEditingFormula()?.xRange[1] || 10}
                          onChange={(e) => {
                            const formula = findEditingFormula();
                            if (formula) {
                              const newXRange: [number, number] = [
                                formula.xRange[0],
                                parseFloat(e.target.value) || 10
                              ];
                              handleUpdateFormula('xRange', newXRange);
                            }
                          }}
                          className="w-24"
                        />
                      </div>
                    </div>

                    {/* t or theta range for parametric/polar */}
                    {(selectedType === 'parametric' || selectedType === 'polar') && (
                      <div className="w-full md:w-[calc(50%-0.5rem)]">
                        <Label htmlFor="formula-tmin">
                          {selectedType === 'parametric' ? t('tRange') : t('thetaRange')}
                        </Label>
                        <div className="flex items-center gap-2">
                          <Input 
                            id="formula-tmin"
                            type="number"
                            value={findEditingFormula()?.tRange?.[0] || 0}
                            onChange={(e) => {
                              const formula = findEditingFormula();
                              if (formula) {
                                const newTRange: [number, number] = [
                                  parseFloat(e.target.value) || 0,
                                  formula.tRange?.[1] || 2 * Math.PI
                                ];
                                handleUpdateFormula('tRange', newTRange);
                              }
                            }}
                            className="w-24"
                          />
                          <span>to</span>
                          <Input 
                            id="formula-tmax"
                            type="number"
                            value={findEditingFormula()?.tRange?.[1] || (2 * Math.PI)}
                            onChange={(e) => {
                              const formula = findEditingFormula();
                              if (formula) {
                                const newTRange: [number, number] = [
                                  formula.tRange?.[0] || 0,
                                  parseFloat(e.target.value) || 2 * Math.PI
                                ];
                                handleUpdateFormula('tRange', newTRange);
                              }
                            }}
                            className="w-24"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end mt-4">
                    {editingFormulaId && (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          onDeleteFormula(editingFormulaId);
                          // Select the next formula if available
                          const remainingFormulas = formulas.filter(f => f.id !== editingFormulaId);
                          setEditingFormulaId(remainingFormulas.length > 0 ? remainingFormulas[0].id : null);
                        }}
                        className="flex items-center gap-1"
                      >
                        <Trash2 size={14} />
                        {t('deleteFormula')}
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="examples" className="m-0 p-4">
            <div className="space-y-6">
              {Object.entries(examplesByCategory).map(([category, categoryExamples]) => (
                <div key={category}>
                  <h3 className="font-medium mb-2 capitalize">{t(`categories.${category}`)}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {categoryExamples.map((example) => (
                      <Card key={example.name} className="overflow-hidden">
                        <CardHeader className="p-3 pb-2">
                          <CardTitle className="text-sm">{example.name}</CardTitle>
                          <CardDescription className="text-xs">{example.description}</CardDescription>
                        </CardHeader>
                        <CardFooter className="p-3 pt-0 flex justify-between items-center">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            {example.type === 'function' ? (
                              <Function size={14} />
                            ) : example.type === 'parametric' ? (
                              <Circle size={14} />
                            ) : (
                              <Sigma size={14} />
                            )}
                            <span>{example.type}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="secondary"
                            onClick={() => loadExample(example)}
                            className="text-xs h-7"
                          >
                            {t('use')}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
};

export default FormulaEditor;
