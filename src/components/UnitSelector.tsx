import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MeasurementUnit } from '@/types/shapes';
import { useTranslate } from '@/utils/translate';

interface UnitSelectorProps {
  value: MeasurementUnit;
  onChange: (value: MeasurementUnit) => void;
  onUnitChange?: (unit: MeasurementUnit) => void; // Make this prop optional
}

const UnitSelector: React.FC<UnitSelectorProps> = ({ value, onChange, onUnitChange }) => {
  const t = useTranslate();
  
  console.log('UnitSelector received value:', value, 'Type:', typeof value);
  
  // Map of unit codes to translation keys
  const unitLabels: Record<MeasurementUnit, string> = {
    'cm': 'units.centimeters',
    'in': 'units.inches',
  };

  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="unit-selector" className="text-xs font-medium">
        {t('units.label')}
      </Label>
      <Select
        value={value}
        onValueChange={(v) => {
          console.log('Select onValueChange called with:', v, 'Type:', typeof v);
          onChange(v as MeasurementUnit);
          if (onUnitChange) {
            onUnitChange(v as MeasurementUnit); // Check if onUnitChange is defined
          }
        }}
      >
        <SelectTrigger id="unit-selector" className="w-full">
          <SelectValue placeholder={t('units.placeholder')} />
        </SelectTrigger>
        <SelectContent position="popper">
          {(Object.keys(unitLabels) as MeasurementUnit[]).map((unit) => (
            <SelectItem key={unit} value={unit}>
              {t(unitLabels[unit])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default UnitSelector;
