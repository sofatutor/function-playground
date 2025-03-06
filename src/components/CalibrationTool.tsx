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
      <CardHeader>
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
            <p className="text-sm text-muted-foreground mb-4">
              {t('configModal.calibration.placeRuler')}
            </p>
            <div className="relative mb-8 z-50">
              <div 
                ref={lineRef}
                className="relative h-6 bg-transparent border-2 border-primary rounded-md z-50" 
                style={{ width: `${calibrationLength * currentPixelsPerUnit}px` }}
              ></div>
              <div className="absolute -bottom-6 left-0 right-0 text-center text-sm">
                {t('configModal.calibration.lineDescription', { length: String(calibrationLength), unit: unitLabel })}
              </div>
            </div>
            
            <div className="space-y-4">
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
              
              <div className="mt-4 p-2 bg-muted rounded-md">
                <div className="flex justify-between">
                  <span className="text-sm">{t('configModal.calibration.currentValue')}:</span>
                  <span className="text-sm font-medium">
                    {currentPixelsPerUnit.toFixed(2)} {t('configModal.calibration.pixelsPerUnit', { unit: unitAbbr })}
                  </span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
      {isCalibrating && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={cancelCalibration}>{t('configModal.calibration.cancelButton')}</Button>
          <Button onClick={completeCalibration}>{t('configModal.calibration.applyButton')}</Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default CalibrationTool; 