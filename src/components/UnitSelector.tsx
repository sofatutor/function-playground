
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

interface UnitSelectorProps {
  value: MeasurementUnit;
  onChange: (value: MeasurementUnit) => void;
}

const UnitSelector: React.FC<UnitSelectorProps> = ({ value, onChange }) => {
  // Map of unit codes to display names for localization
  const unitLabels: Record<MeasurementUnit, { de: string, en: string }> = {
    'cm': { de: 'Zentimeter', en: 'Centimeters' },
    'inch': { de: 'Zoll', en: 'Inches' },
  };

  return (
    <div className="flex flex-col space-y-1.5">
      <Label htmlFor="unit-selector" className="text-xs font-medium">
        {/* German label with English in parentheses */}
        Maßeinheit (Units)
      </Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as MeasurementUnit)}
      >
        <SelectTrigger id="unit-selector" className="w-full">
          <SelectValue placeholder="Maßeinheit wählen" />
        </SelectTrigger>
        <SelectContent position="popper">
          {(Object.keys(unitLabels) as MeasurementUnit[]).map((unit) => (
            <SelectItem key={unit} value={unit}>
              {unitLabels[unit].de} ({unitLabels[unit].en})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default UnitSelector;
