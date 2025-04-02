import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Maximize2, Minimize2 } from 'lucide-react';
import { Formula } from '@/types/formula';
import { MeasurementUnit } from '@/types/shapes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface FunctionSidebarProps {
  formulas: Formula[];
  selectedFormula: Formula | null;
  onAddFormula: () => void;
  onDeleteFormula: (id: string) => void;
  onSelectFormula: (formula: Formula) => void;
  onUpdateFormula: (id: string, updates: Partial<Formula>) => void;
  measurementUnit: MeasurementUnit;
  className?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
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
  isFullscreen = false,
  onToggleFullscreen
}: FunctionSidebarProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('flex flex-col h-full bg-background border-l', className)}>
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">{t('formula.title')}</h2>
        <div className="flex items-center space-x-2">
          {onToggleFullscreen && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={onToggleFullscreen}
                    className="h-8 w-8"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="h-4 w-4" />
                    ) : (
                      <Maximize2 className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isFullscreen ? t('exitFullscreen') : t('enterFullscreen')}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button
            variant="outline"
            size="icon"
            onClick={onAddFormula}
            title={t('formula.add')}
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
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
    </div>
  );
} 