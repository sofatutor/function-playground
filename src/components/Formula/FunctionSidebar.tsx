import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2 } from 'lucide-react';
import { Formula } from '@/types/formula';
import FormulaEditor from '@/components/FormulaEditor';
import { MeasurementUnit } from '@/types/shapes';
import { ParameterSlider } from '@/components/Formula/ParameterSlider';
import { detectParameters } from '@/utils/parameterDetection';

interface FunctionSidebarProps {
  formulas: Formula[];
  selectedFormula: Formula | null;
  onAddFormula: () => void;
  onDeleteFormula: (id: string) => void;
  onSelectFormula: (formula: Formula) => void;
  onUpdateFormula: (id: string, updates: Partial<Formula>) => void;
  measurementUnit: MeasurementUnit;
  className?: string;
}

export default function FunctionSidebar({
  formulas,
  selectedFormula,
  onAddFormula,
  onDeleteFormula,
  onSelectFormula,
  onUpdateFormula,
  measurementUnit,
  className,
}: FunctionSidebarProps) {
  const { t } = useTranslation();

  const handleParameterChange = (parameterName: string, value: number) => {
    if (!selectedFormula) return;

    const updatedParameters = {
      ...selectedFormula.parameters,
      [parameterName]: value,
    };

    onUpdateFormula(selectedFormula.id, {
      parameters: updatedParameters,
    });
  };

  return (
    <div className={cn('flex flex-col h-full bg-background border-l', className)}>
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">{t('formula.title')}</h2>
        <Button
          variant="outline"
          size="icon"
          onClick={onAddFormula}
          title={t('formula.add')}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {formulas.map((formula) => (
            <div
              key={formula.id}
              className={cn(
                'p-4 rounded-lg border transition-colors',
                selectedFormula?.id === formula.id
                  ? 'bg-accent border-accent-foreground'
                  : 'hover:bg-accent/50'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <Button
                  variant="ghost"
                  className="flex-1 justify-start"
                  onClick={() => onSelectFormula(formula)}
                >
                  {formula.expression || t('formula.untitled')}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteFormula(formula.id)}
                  title={t('formula.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {selectedFormula && (
        <div className="border-t p-4 space-y-4">
          <FormulaEditor
            formulas={[selectedFormula]}
            onAddFormula={() => {}}
            onUpdateFormula={onUpdateFormula}
            onDeleteFormula={onDeleteFormula}
            _measurementUnit={measurementUnit}
            isOpen={true}
            selectedFormulaId={selectedFormula.id}
            onSelectFormula={() => onSelectFormula(selectedFormula)}
          />

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">{t('formula.parameters')}</h3>
            {detectParameters(selectedFormula.expression).map((param) => (
              <ParameterSlider
                key={param.name}
                parameterName={param.name}
                value={selectedFormula.parameters?.[param.name] ?? param.defaultValue}
                onChange={(value) => handleParameterChange(param.name, value)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 