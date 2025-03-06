
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
  
  return (
    <div className="flex items-center space-x-1 p-1 bg-white rounded-lg shadow-sm border border-gray-200 animate-fade-in">
      <ToolButton 
        active={activeMode === 'select'}
        onClick={() => onModeChange('select')}
        tooltip={t('tooltips.select')}
      >
        <MousePointer size={18} />
      </ToolButton>
      
      <Separator orientation="vertical" className="h-8 mx-1" />
      
      <ToolButton 
        active={activeMode === 'create' && activeShapeType === 'rectangle'}
        onClick={() => {
          onModeChange('create');
          onShapeTypeChange('rectangle');
        }}
        tooltip={t('tooltips.rectangle')}
        formula={getFormula('rectangle', 'area', language)}
        formulaExplanation={t('formulaExplanations.rectangle.area')}
      >
        <Square size={18} />
      </ToolButton>
      
      <ToolButton 
        active={activeMode === 'create' && activeShapeType === 'circle'}
        onClick={() => {
          onModeChange('create');
          onShapeTypeChange('circle');
        }}
        tooltip={t('tooltips.circle')}
        formula={getFormula('circle', 'area', language)}
        formulaExplanation={t('formulaExplanations.circle.area')}
      >
        <Circle size={18} />
      </ToolButton>
      
      <ToolButton 
        active={activeMode === 'create' && activeShapeType === 'triangle'}
        onClick={() => {
          onModeChange('create');
          onShapeTypeChange('triangle');
        }}
        tooltip={t('tooltips.triangle')}
        formula={getFormula('triangle', 'area', language)}
        formulaExplanation={t('formulaExplanations.triangle.area')}
      >
        <Triangle size={18} />
      </ToolButton>
      
      <ToolButton 
        active={activeMode === 'create' && activeShapeType === 'line'}
        onClick={() => {
          onModeChange('create');
          onShapeTypeChange('line');
        }}
        tooltip={t('tooltips.line')}
        formula="d = \\sqrt{(x_2 - x_1)^2 + (y_2 - y_1)^2}"
        formulaExplanation={t('tooltips.lineExplanation') || "Calculates the straight-line distance between two points"}
      >
        <Ruler size={18} />
      </ToolButton>
      
      <Separator orientation="vertical" className="h-8 mx-1" />
      
      {onToggleFormulaEditor && (
        <>
          <ToolButton 
            active={isFormulaEditorOpen}
            onClick={onToggleFormulaEditor}
            tooltip={t('tooltips.plot')}
            formulaExplanation={t('tooltips.plotDescription')}
          >
            <FunctionSquare size={18} />
          </ToolButton>
          
          <Separator orientation="vertical" className="h-8 mx-1" />
        </>
      )}
      
      <ToolButton 
        active={activeMode === 'rotate'}
        onClick={() => onModeChange('rotate')}
        disabled={!hasSelectedShape}
        tooltip={t('tooltips.rotate')}
      >
        <RotateCw size={18} />
      </ToolButton>
      
      <Separator orientation="vertical" className="h-8 mx-1" />
      
      <ToolButton 
        onClick={onDelete}
        disabled={!canDelete}
        tooltip={t('tooltips.delete')}
        variant="destructive"
      >
        <Trash size={18} />
      </ToolButton>
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
}

const ToolButton: React.FC<ToolButtonProps> = ({
  children,
  onClick,
  active = false,
  disabled = false,
  tooltip,
  formula,
  formulaExplanation,
  variant = 'default'
}) => {
  const t = useTranslate();
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant === 'destructive' ? 'destructive' : active ? 'default' : 'outline'}
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className={`h-9 w-9 transition-all ${active ? 'bg-geometry-primary text-white' : ''} 
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center" className={formula ? "max-w-xs p-4" : ""}>
          {formula ? (
            <div className="space-y-2">
              <p className="text-xs font-medium">{tooltip}</p>
              <div className="katex-formula pt-1">
                <InlineMath math={formula} />
              </div>
              {formulaExplanation && (
                <div className="text-xs text-muted-foreground mt-1">
                  {formulaExplanation}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs">{tooltip}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default Toolbar;
