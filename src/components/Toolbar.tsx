import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Square, Circle, Triangle, MousePointer, Move, RotateCw, Trash, Ruler, FunctionSquare } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import type { ShapeType, OperationMode } from '@/types/shapes';
import { useTranslate } from '@/utils/translate';
import { useConfig } from '@/context/ConfigContext';
import { getFormula } from '@/utils/geometryUtils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ToolbarProps {
  activeMode: OperationMode;
  activeShapeType: ShapeType;
  onModeChange: (mode: OperationMode) => void;
  onShapeTypeChange: (type: ShapeType) => void;
  onClear: () => void;
  onDelete: () => void;
  hasSelectedShape: boolean;
  canDelete: boolean;
  onToggleFormulaEditor?: () => void;
  isFormulaEditorOpen?: boolean;
}

const Toolbar: React.FC<ToolbarProps> = ({
  activeMode,
  activeShapeType,
  onModeChange,
  onShapeTypeChange,
  onClear,
  onDelete,
  hasSelectedShape,
  canDelete,
  onToggleFormulaEditor,
  isFormulaEditorOpen = false
}) => {
  const t = useTranslate();
  const { language } = useConfig();
  const isMobile = useIsMobile();
  
  return (
    <div id="geometry-toolbar" className="flex items-center space-x-1 p-1 bg-white rounded-lg shadow-sm border border-gray-200 animate-fade-in">
      <ToolButton 
        id="select-tool"
        active={activeMode === 'select'}
        onClick={() => onModeChange('select')}
        tooltip={t('tooltips.select')}
        formulaExplanation={t('tooltips.moveDescription')}
      >
        <MousePointer className="h-3 w-3 sm:h-4 sm:w-4" />
      </ToolButton>
      
      <Separator orientation="vertical" className="h-6 sm:h-8 mx-0.5 sm:mx-1" />
      
      <ToolButton 
        id="rectangle-tool"
        active={activeMode === 'create' && activeShapeType === 'rectangle'}
        onClick={() => {
          onModeChange('create');
          onShapeTypeChange('rectangle');
        }}
        tooltip={t('shapeNames.rectangle')}
        formula={getFormula('rectangle', 'area', language)}
        formulaExplanation={t('formulaExplanations.rectangle.area')}
      >
        <Square className="h-3 w-3 sm:h-4 sm:w-4" />
      </ToolButton>
      
      <ToolButton 
        id="circle-tool"
        active={activeMode === 'create' && activeShapeType === 'circle'}
        onClick={() => {
          onModeChange('create');
          onShapeTypeChange('circle');
        }}
        tooltip={t('shapeNames.circle')}
        formula={getFormula('circle', 'area', language)}
        formulaExplanation={t('formulaExplanations.circle.area')}
      >
        <Circle className="h-3 w-3 sm:h-4 sm:w-4" />
      </ToolButton>
      
      <ToolButton 
        id="triangle-tool"
        active={activeMode === 'create' && activeShapeType === 'triangle'}
        onClick={() => {
          onModeChange('create');
          onShapeTypeChange('triangle');
        }}
        tooltip={t('shapeNames.triangle')}
        formula={getFormula('triangle', 'area', language)}
        formulaExplanation={t('formulaExplanations.triangle.area')}
      >
        <Triangle className="h-3 w-3 sm:h-4 sm:w-4" />
      </ToolButton>
      
      <ToolButton 
        id="line-tool"
        active={activeMode === 'create' && activeShapeType === 'line'}
        onClick={() => {
          onModeChange('create');
          onShapeTypeChange('line');
        }}
        tooltip={t('shapeNames.line')}
        formula="d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}"
        formulaExplanation={t('formulaExplanations.line.length')}
      >
        <Ruler className="h-3 w-3 sm:h-4 sm:w-4" />
      </ToolButton>
      
      <ToolButton 
        active={activeMode === 'rotate'}
        onClick={() => onModeChange('rotate')}
        disabled={!hasSelectedShape}
        tooltip={t('tooltips.rotate')}
        formulaExplanation={t('tooltips.rotateDescription')}
      >
        <RotateCw className="h-3 w-3 sm:h-4 sm:w-4" />
      </ToolButton>

      <Separator orientation="vertical" className="h-6 sm:h-8 mx-0.5 sm:mx-1" />

      {onToggleFormulaEditor && (
        <>
          <ToolButton 
            id="plot-formula-button"
            data-testid="plot-formula-button"
            active={isFormulaEditorOpen}
            onClick={onToggleFormulaEditor}
            tooltip={t('tooltips.plot')}
            formulaExplanation={t('tooltips.plotDescription')}
          >
            <FunctionSquare className="h-3 w-3 sm:h-4 sm:w-4" />
          </ToolButton>
        </>
      )}
    </div>
  );
};

interface ToolButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  tooltip: string;
  formula?: string;
  formulaExplanation?: string;
  variant?: 'default' | 'destructive';
  id?: string;
}

const ToolButton: React.FC<ToolButtonProps> = ({
  children,
  onClick,
  active = false,
  disabled = false,
  tooltip,
  formula,
  formulaExplanation,
  variant = 'default',
  id
}) => {
  const t = useTranslate();
  const isMobile = useIsMobile();
  
  // Determine the button variant based on active state and provided variant
  const buttonVariant = active 
    ? 'default' 
    : variant === 'destructive' 
      ? 'destructive' 
      : 'outline';
  
  // For mobile, we don't use tooltips
  if (isMobile) {
    return (
      <Button
        id={id}
        data-testid={id}
        variant={buttonVariant}
        size="icon"
        className={`h-7 w-7 sm:h-8 sm:w-8 ${active ? 'bg-primary text-primary-foreground' : ''}`}
        onClick={onClick}
        disabled={disabled}
        aria-label={tooltip}
      >
        {children}
      </Button>
    );
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            id={id}
            data-testid={id}
            variant={buttonVariant}
            size="icon"
            className={`h-7 w-7 sm:h-8 sm:w-8 ${active ? 'bg-primary text-primary-foreground' : ''}`}
            onClick={onClick}
            disabled={disabled}
            aria-label={tooltip}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">{tooltip}</p>
            {formula && (
              <div className="text-xs bg-muted p-1 rounded">
                <InlineMath math={formula} />
              </div>
            )}
            {formulaExplanation && (
              <p className="text-xs text-muted-foreground">{formulaExplanation}</p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default Toolbar;
