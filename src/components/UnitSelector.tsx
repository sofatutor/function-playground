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
  compact?: boolean; // Add a prop to control the compact style
}

const UnitSelector: React.FC<UnitSelectorProps> = ({ 
  value, 
  onChange, 
  onUnitChange,
  compact = true // Default to compact style
}) => {
  const t = useTranslate();
  
  // Map of unit codes to translation keys
  const unitLabels: Record<MeasurementUnit, string> = {
    'cm': 'units.centimeters',
    'in': 'units.inches',
  };

  return (
    <div className={`flex flex-col ${compact ? '' : 'space-y-1.5'}`}>
      {!compact && (
        <Label htmlFor="unit-selector" className="text-xs font-medium">
          {t('units.label')}
        </Label>
      )}
      <Select
        value={value}
        onValueChange={(v) => {
          onChange(v as MeasurementUnit);
          if (onUnitChange) {
            onUnitChange(v as MeasurementUnit);
          }
        }}
      >
        <SelectTrigger 
          id="unit-selector" 
          className={`w-full ${compact ? 'h-8 text-xs' : ''}`}
        >
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
