import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { Formula } from '@/types/formula';
import { useTranslate } from '@/utils/translate';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';

interface FormulaZoomControlProps {
  formulas: Formula[];
  onUpdateFormula: (id: string, updates: Partial<Formula>) => void;
  selectedFormulaId?: string | null;
}

const FormulaZoomControl: React.FC<FormulaZoomControlProps> = ({
  formulas,
  onUpdateFormula,
  selectedFormulaId
}) => {
  const t = useTranslate();
  
  // If no formulas or no selected formula, don't render
  if (formulas.length === 0 || !selectedFormulaId) {
    return null;
  }
  
  // Find the selected formula
  const selectedFormula = formulas.find(f => f.id === selectedFormulaId);
  if (!selectedFormula) {
    return null;
  }
  
  // Get the current scale factor
  const currentScaleFactor = selectedFormula.scaleFactor || 1.0;
  
  // Convert actual scale factor to logarithmic value for the slider
  const _logScaleFactor = Math.log10(currentScaleFactor);
  
  // Handle scale factor change
  const handleScaleChange = (value: number) => {
    // Convert from logarithmic slider value to actual scale factor
    // This gives finer control at lower values
    const actualScaleFactor = Math.pow(10, value);
    onUpdateFormula(selectedFormulaId, { scaleFactor: actualScaleFactor });
  };
  
  // Handle zoom in/out buttons
  const handleZoomIn = () => {
    const newScaleFactor = Math.min(currentScaleFactor * 1.25, 10);
    onUpdateFormula(selectedFormulaId, { scaleFactor: newScaleFactor });
  };
  
  const handleZoomOut = () => {
    const newScaleFactor = Math.max(currentScaleFactor / 1.25, 0.001);
    onUpdateFormula(selectedFormulaId, { scaleFactor: newScaleFactor });
  };
  
  return (
    <div className="flex items-center space-x-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              className="h-9 w-9"
            >
              <ZoomOut size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">{t('tooltips.zoomOut')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-2 text-xs"
          >
            {currentScaleFactor < 0.01 
              ? currentScaleFactor.toFixed(3) 
              : currentScaleFactor.toFixed(2)}x
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">{t('scaleFactor')}</h4>
            <p className="text-xs text-muted-foreground">{t('scaleFactorHint')}</p>
            <Slider
              value={[currentScaleFactor]}
              min={0.001}
              max={10}
              step={0.001}
              onValueChange={([value]) => handleScaleChange(value[0])}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{t('scaleMin')}</span>
              <span>{t('scaleDefault')}</span>
              <span>{t('scaleMax')}</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              className="h-9 w-9"
            >
              <ZoomIn size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">{t('tooltips.zoomIn')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default FormulaZoomControl; 