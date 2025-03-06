import React from 'react';
import { useComponentConfig } from '@/context/ConfigContext';
import { useTranslate } from '@/utils/translate';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CalibrationTool from './CalibrationTool';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { getStoredPixelsPerUnit } from '@/utils/geometry/common';

const ComponentConfigModal: React.FC = () => {
  const { 
    isComponentConfigModalOpen, 
    setComponentConfigModalOpen,
    pixelsPerUnit,
    setPixelsPerUnit,
    measurementUnit,
    setMeasurementUnit
  } = useComponentConfig();
  
  const t = useTranslate();
  
  const handleCalibrationComplete = (newPixelsPerUnit: number) => {
    setPixelsPerUnit(newPixelsPerUnit);
    // Store the calibration value in localStorage
    localStorage.setItem(`pixelsPerUnit_${measurementUnit}`, newPixelsPerUnit.toString());
  };
  
  const handleUnitChange = (value: string) => {
    console.log('handleUnitChange called with value:', value);
    const newUnit = value as 'cm' | 'in';
    
    // Store the unit selection in localStorage
    localStorage.setItem('measurement_unit', newUnit);
    console.log('Stored measurement unit in localStorage:', newUnit);
    
    // Update the unit in the context
    setMeasurementUnit(newUnit);
    console.log('Updated measurement unit in context:', newUnit);
    
    // Update the pixels per unit based on the new unit
    const newPixelsPerUnit = getStoredPixelsPerUnit(newUnit);
    setPixelsPerUnit(newPixelsPerUnit);
    console.log('Updated pixels per unit in context:', newPixelsPerUnit);
    
    // Force a refresh of the component to ensure the changes are applied
    // This is important to trigger the useEffect in GeometryCanvas
    window.dispatchEvent(new Event('resize'));
    console.log('Dispatched resize event');
  };
  
  return (
    <Dialog open={isComponentConfigModalOpen} onOpenChange={setComponentConfigModalOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="pb-2">
          <DialogTitle>{t('componentConfigModal.title')}</DialogTitle>
          <DialogDescription>
            {t('componentConfigModal.description')}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="units" className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="units">{t('componentConfigModal.tabs.units')}</TabsTrigger>
            <TabsTrigger value="calibration">{t('componentConfigModal.tabs.calibration')}</TabsTrigger>
          </TabsList>
          
          {/* Units Tab */}
          <TabsContent value="units" className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {t('componentConfigModal.units.description')}
            </p>
            <div className="space-y-2">
              <Label htmlFor="measurement-unit">{t('units.label')}</Label>
              <Select value={measurementUnit} onValueChange={handleUnitChange}>
                <SelectTrigger id="measurement-unit">
                  <SelectValue placeholder={t('units.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cm">{t('units.centimeters')}</SelectItem>
                  <SelectItem value="in">{t('units.inches')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          {/* Calibration Tab */}
          <TabsContent value="calibration" className="relative z-[100] py-1">
            <CalibrationTool
              measurementUnit={measurementUnit}
              onCalibrationComplete={handleCalibrationComplete}
              defaultPixelsPerUnit={pixelsPerUnit}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ComponentConfigModal; 