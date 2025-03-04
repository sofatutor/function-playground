import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MeasurementUnit } from '@/types/shapes';

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
  const [calibrationLength, setCalibrationLength] = useState<number>(10);
  const [pixelsPerUnit, setPixelsPerUnit] = useState<number>(defaultPixelsPerUnit);
  const [calibrationLineWidth, setCalibrationLineWidth] = useState<number>(0);
  const [isCalibrating, setIsCalibrating] = useState<boolean>(false);
  const lineRef = useRef<HTMLDivElement>(null);

  // Update the calibration line width based on the current pixels per unit
  useEffect(() => {
    if (isCalibrating) {
      setCalibrationLineWidth(calibrationLength * pixelsPerUnit);
    }
  }, [calibrationLength, pixelsPerUnit, isCalibrating]);

  const startCalibration = () => {
    setIsCalibrating(true);
    // Initialize with current value
    setCalibrationLineWidth(calibrationLength * pixelsPerUnit);
  };

  const adjustCalibration = (increase: boolean) => {
    const step = increase ? 1 : -1;
    const newPixelsPerUnit = Math.max(1, pixelsPerUnit + step);
    setPixelsPerUnit(newPixelsPerUnit);
  };

  const fineTuneCalibration = (increase: boolean) => {
    const step = increase ? 0.1 : -0.1;
    const newPixelsPerUnit = Math.max(0.1, parseFloat((pixelsPerUnit + step).toFixed(1)));
    setPixelsPerUnit(newPixelsPerUnit);
  };

  const completeCalibration = () => {
    onCalibrationComplete(pixelsPerUnit);
    setIsCalibrating(false);
  };

  const cancelCalibration = () => {
    setPixelsPerUnit(defaultPixelsPerUnit);
    setIsCalibrating(false);
  };

  const unitLabel = measurementUnit === 'cm' ? 'centimeters' : 'inches';
  const unitAbbr = measurementUnit;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Screen Calibration</CardTitle>
        <CardDescription>
          Calibrate your screen to ensure accurate physical measurements
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isCalibrating ? (
          <div className="space-y-4">
            <p className="text-sm">
              Your screen may not display measurements at their actual physical size. 
              Use this tool to calibrate your display for accurate measurements.
            </p>
            <div className="flex items-center space-x-2">
              <Label htmlFor="calibration-length">Calibration Length ({unitAbbr}):</Label>
              <Input
                id="calibration-length"
                type="number"
                min="1"
                max="30"
                value={calibrationLength}
                onChange={(e) => setCalibrationLength(parseFloat(e.target.value) || 10)}
                className="w-20"
              />
            </div>
            <Button onClick={startCalibration}>Start Calibration</Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Place a physical ruler or measuring tape against your screen and adjust the line below 
                until it matches exactly {calibrationLength} {unitLabel}.
              </p>
              <div className="flex flex-col items-center space-y-4">
                <div 
                  ref={lineRef}
                  className="h-4 bg-geometry-primary rounded-sm"
                  style={{ width: `${calibrationLineWidth}px` }}
                />
                <div className="text-xs text-muted-foreground">
                  This line should be exactly {calibrationLength} {unitLabel} long
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Coarse Adjustment:</span>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => adjustCalibration(false)}
                  >
                    -
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => adjustCalibration(true)}
                  >
                    +
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Fine Adjustment:</span>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fineTuneCalibration(false)}
                  >
                    -0.1
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => fineTuneCalibration(true)}
                  >
                    +0.1
                  </Button>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-sm font-medium">Current Value:</span>
                <span className="font-mono">{pixelsPerUnit.toFixed(1)} pixels per {unitAbbr}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      {isCalibrating && (
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={cancelCalibration}>Cancel</Button>
          <Button onClick={completeCalibration}>Apply Calibration</Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default CalibrationTool; 