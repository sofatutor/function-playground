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
  const logScaleFactor = Math.log10(currentScaleFactor);
  
  // Handle scale factor change
  const handleScaleFactorChange = (value: number[]) => {
    // Convert from logarithmic slider value to actual scale factor
    // This gives finer control at lower values
    const actualScaleFactor = Math.pow(10, value[0]);
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
            <p className="text-xs">{t('zoomOut')}</p>
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
        <PopoverContent className="w-64 p-4">
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
              <span>0.001x</span>
              <span>1.0x</span>
              <span>10x</span>
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
            <p className="text-xs">{t('zoomIn')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default FormulaZoomControl; 