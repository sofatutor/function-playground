import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MeasurementUnit } from '@/types/shapes';
import { useTranslate } from '@/utils/translate';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MinusIcon, PlusIcon } from "lucide-react";

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
  const [currentPixelsPerUnit, setCurrentPixelsPerUnit] = useState<number>(defaultPixelsPerUnit);
  const [calibrationLineWidth, setCalibrationLineWidth] = useState<number>(0);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const lineRef = useRef<HTMLDivElement>(null);

  // Update the calibration line width based on the current pixels per unit
  useEffect(() => {
    if (isCalibrating) {
      setCalibrationLineWidth(calibrationLength * currentPixelsPerUnit);
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
    onCalibrationComplete(currentPixelsPerUnit);
    
    // Store the calibration value in localStorage
    localStorage.setItem(`pixelsPerUnit_${measurementUnit}`, currentPixelsPerUnit.toString());
    
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
                  style={{ width: `${calibrationLength * currentPixelsPerUnit}px` }}
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
                  <Button variant="outline" size="icon" onClick={() => adjustCalibration(false)}>
                    <MinusIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => adjustCalibration(true)}>
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div>
                <Label>{t('configModal.calibration.fineAdjustment')}</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Button variant="outline" size="icon" onClick={() => fineTuneCalibration(false)}>
                    <MinusIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => fineTuneCalibration(true)}>
                    <PlusIcon className="h-4 w-4" />
                  </Button>
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