import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MeasurementUnit } from '@/types/shapes';
import { useTranslate } from '@/utils/translate';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface CalibrationToolProps {
  measurementUnit: MeasurementUnit;
  onCalibrationComplete: (pixelsPerUnit: number) => void;
  defaultPixelsPerUnit: number;
}

const CalibrationTool: React.FC<CalibrationToolProps> = ({ 
  measurementUnit, 
  onCalibrationComplete,
  defaultPixelsPerUnit
}) => {
  const t = useTranslate();
  const [calibrationLength, setCalibrationLength] = useState<number>(10);
  // Set appropriate defaults based on actual screen measurements
  const [currentPixelsPerUnit, setCurrentPixelsPerUnit] = useState<number>(
    defaultPixelsPerUnit || (measurementUnit === 'cm' ? 60 : 152.4)
  );
  const [calibrationLineWidth, setCalibrationLineWidth] = useState<number>(0);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const [devicePixelRatio, setDevicePixelRatio] = useState<number>(window.devicePixelRatio || 1);
  const lineRef = useRef<HTMLDivElement>(null);

  // Update currentPixelsPerUnit when measurementUnit changes
  useEffect(() => {
    // When switching units, check for stored values first
    const storedValue = localStorage.getItem(`pixelsPerUnit_${measurementUnit}`);
    if (storedValue) {
      const value = parseFloat(storedValue);
      console.log(`CalibrationTool: Retrieved stored value for ${measurementUnit}:`, value);
      setCurrentPixelsPerUnit(value);
    } else {
      // Use appropriate defaults if no stored value exists
      const defaultValue = measurementUnit === 'cm' ? 60 : 152.4;
      console.log(`CalibrationTool: No stored value for ${measurementUnit}, using default:`, defaultValue);
      setCurrentPixelsPerUnit(defaultValue);
    }
  }, [measurementUnit]);

  // Update devicePixelRatio if it changes (for display purposes only)
  useEffect(() => {
    const updatePixelRatio = () => {
      setDevicePixelRatio(window.devicePixelRatio || 1);
    };
    
    window.addEventListener('resize', updatePixelRatio);
    return () => {
      window.removeEventListener('resize', updatePixelRatio);
    };
  }, []);

  // Update the calibration line width based on the current pixels per unit
  useEffect(() => {
    if (isCalibrating) {
      // Use the current pixels per unit directly without any correction
      setCalibrationLineWidth(calibrationLength * currentPixelsPerUnit);
      console.log('Calibration line width:', calibrationLength * currentPixelsPerUnit);
    }
  }, [calibrationLength, currentPixelsPerUnit, isCalibrating]);

  const startCalibration = () => {
    setIsCalibrating(true);
    // Initialize with current value
    setCalibrationLineWidth(calibrationLength * currentPixelsPerUnit);
  };

  const adjustCalibration = (increase: boolean) => {
    const step = increase ? 1 : -1;
    const newPixelsPerUnit = Math.max(1, currentPixelsPerUnit + step);
    setCurrentPixelsPerUnit(newPixelsPerUnit);
  };

  const fineTuneCalibration = (increase: boolean) => {
    const step = increase ? 0.1 : -0.1;
    const newPixelsPerUnit = Math.max(0.1, parseFloat((currentPixelsPerUnit + step).toFixed(1)));
    setCurrentPixelsPerUnit(newPixelsPerUnit);
  };

  const completeCalibration = () => {
    // Pass the calibration value directly to the parent component
    onCalibrationComplete(currentPixelsPerUnit);
    
    // Store the calibration value in localStorage
    localStorage.setItem(`pixelsPerUnit_${measurementUnit}`, currentPixelsPerUnit.toString());
    console.log('Stored calibration value:', currentPixelsPerUnit, 'for unit:', measurementUnit);
    
    // Force a refresh of the component to ensure the changes are applied
    window.dispatchEvent(new Event('resize'));
    
    setIsCalibrating(false);
  };

  const cancelCalibration = () => {
    setCurrentPixelsPerUnit(defaultPixelsPerUnit);
    setIsCalibrating(false);
  };

  const unitLabel = measurementUnit === 'cm' ? t('units.centimeters') : t('units.inches');
  const unitAbbr = measurementUnit;

  // Get the recommended value based on the unit
  const getRecommendedValue = () => {
    return measurementUnit === 'cm' 
      ? 'For your display, a value around 60 pixels per cm is typical.'
      : 'For your display, a value around 152.4 pixels per inch is typical.';
  };

  return (
    <Card className="relative p-4 w-full max-w-md mx-auto z-[100]">
      <CardHeader className="pb-2">
        <CardTitle>{t('configModal.calibration.title')}</CardTitle>
        <CardDescription>{t('configModal.calibration.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isCalibrating ? (
          <>
            <p className="text-sm text-muted-foreground">
              {t('configModal.calibration.instructions')}
            </p>
            <div className="flex flex-col space-y-2">
              <Label htmlFor="calibration-length">{t('configModal.calibration.lengthLabel')}</Label>
              <Select
                value={String(calibrationLength)}
                onValueChange={(value) => setCalibrationLength(Number(value))}
              >
                <SelectTrigger id="calibration-length">
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 {unitLabel}</SelectItem>
                  <SelectItem value="5">5 {unitLabel}</SelectItem>
                  <SelectItem value="10">10 {unitLabel}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={startCalibration} className="w-full">
              {t('configModal.calibration.startButton')}
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-2">
              {t('configModal.calibration.placeRuler')}
            </p>
            
            {/* Centered calibration line */}
            <div className="flex justify-center items-center mb-6">
              <div className="relative">
                <div 
                  ref={lineRef}
                  className="relative h-6 bg-gradient-to-r from-green-400 to-green-500 rounded-md z-50 shadow-[0_0_8px_rgba(74,222,128,0.6)]" 
                  style={{ width: `${calibrationLineWidth}px` }}
                ></div>
                <div className="absolute -bottom-6 left-0 right-0 text-center text-sm">
                  {t('configModal.calibration.lineDescription', { length: String(calibrationLength), unit: unitLabel })}
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('configModal.calibration.coarseAdjustment')}</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => adjustCalibration(false)}>
                          <MinusIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('tooltips.coarseAdjustment')}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => adjustCalibration(true)}>
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('tooltips.coarseAdjustment')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              
              <div>
                <Label>{t('configModal.calibration.fineAdjustment')}</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => fineTuneCalibration(false)}>
                          <MinusIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('tooltips.fineAdjustment')}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => fineTuneCalibration(true)}>
                          <PlusIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('tooltips.fineAdjustment')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
            
            <div className="mt-2 p-2 bg-muted rounded-md">
              <div className="flex justify-between">
                <span className="text-sm">{t('configModal.calibration.currentValue')}:</span>
                <span className="text-sm font-medium">
                  {currentPixelsPerUnit.toFixed(2)} {t('configModal.calibration.pixelsPerUnit', { unit: unitAbbr })}
                </span>
              </div>
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>Device pixel ratio:</span>
                <span>{devicePixelRatio.toFixed(2)}</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <p>{getRecommendedValue()}</p>
              </div>
            </div>
            
            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={cancelCalibration}>
                {t('configModal.calibration.cancelButton')}
              </Button>
              <Button onClick={completeCalibration}>
                {t('configModal.calibration.applyButton')}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CalibrationTool; 