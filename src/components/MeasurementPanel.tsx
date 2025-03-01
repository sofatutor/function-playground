import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Circle, Square, Triangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import type { AnyShape, MeasurementUnit } from '@/types/shapes';
import { useTranslate } from '@/utils/translate';
import { getFormula } from '@/utils/geometryUtils';
import { useConfig } from '@/context/ConfigContext';

interface MeasurementPanelProps {
  selectedShape: AnyShape | null;
  measurements: Record<string, string>;
  measurementUnit: MeasurementUnit;
}

const MeasurementPanel: React.FC<MeasurementPanelProps> = ({ 
  selectedShape, 
  measurements, 
  measurementUnit 
}) => {
  const t = useTranslate();
  const { language } = useConfig();

  if (!selectedShape) {
    return (
      <Card className="w-full bg-white animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {t('measurements')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t('selectShapeToViewMeasurements')}
          </p>
        </CardContent>
      </Card>
    );
  }

  const ShapeIcon = () => {
    switch (selectedShape.type) {
      case 'circle':
        return <Circle className="h-5 w-5 text-geometry-secondary" />;
      case 'rectangle':
        return <Square className="h-5 w-5 text-geometry-secondary" />;
      case 'triangle':
        return <Triangle className="h-5 w-5 text-geometry-secondary" />;
      default:
        return null;
    }
  };

  const shapeName = t(`shapeNames.${selectedShape.type}`);

  return (
    <Card className="w-full bg-white animate-fade-in">
      <CardHeader className="pb-2 flex flex-row items-center space-x-2">
        <ShapeIcon />
        <CardTitle className="text-sm font-medium">
          {shapeName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(measurements).map(([key, value]) => (
            <div key={key} className="flex flex-col">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs text-muted-foreground cursor-help flex items-center">
                      {t(`measurementLabels.${key}`)}
                      {(key === 'area' || key === 'perimeter' || 
                        (selectedShape.type === 'triangle' && (key === 'height' || key === 'angles'))) && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1 h-3 w-3 text-muted-foreground"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><path d="M12 17h.01"></path></svg>
                      )}
                    </span>
                  </TooltipTrigger>
                  {(key === 'area' || key === 'perimeter' || 
                    (selectedShape.type === 'triangle' && (key === 'height' || key === 'angles'))) && (
                    <TooltipContent side="top" className="max-w-xs p-4">
                      <div className="space-y-2">
                        <div className="font-medium">{t('formula')}:</div>
                        <div className="katex-formula">
                          <InlineMath math={getFormula(selectedShape.type, key, language)} />
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          {t(`formulaExplanations.${selectedShape.type}.${key}`)}
                        </div>
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
              <span className="measurement-value font-medium">
                {value} {t(`unitSuffixes.${key}`, { unit: measurementUnit })}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MeasurementPanel;
