import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnyShape, MeasurementUnit } from '@/types/shapes';
import { useTranslate } from '@/utils/translate';
import MeasurementItem from './MeasurementItem';
import ShapeIcon from './ShapeIcon';
import { normalizeAngleDegrees } from '@/utils/geometry/rotation';

interface MeasurementPanelProps {
  selectedShape: AnyShape | null;
  measurements: Record<string, string>;
  measurementUnit: MeasurementUnit;
  onMeasurementUpdate: (key: string, value: string) => void;
}

const MeasurementPanel: React.FC<MeasurementPanelProps> = ({ 
  selectedShape, 
  measurements, 
  measurementUnit,
  onMeasurementUpdate
}) => {
  const t = useTranslate();
  
  // State to track which measurement is being edited
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  
  // Function to handle starting edit mode
  const handleStartEdit = (key: string, value: string) => {
    setEditingKey(key);
    setEditValue(value);
  };
  
  // Function to handle saving the edited value
  const handleSaveEdit = () => {
    if (editingKey) {
      // For angles, ensure we're using normalized integer values
      if (editingKey.startsWith('angle')) {
        const angleValue = parseFloat(editValue);
        // Normalize angle to the range [-180, 180]
        const normalizedAngle = normalizeAngleDegrees(angleValue);
        const intValue = Math.round(normalizedAngle).toString();
        onMeasurementUpdate(editingKey, intValue);
      } else {
        onMeasurementUpdate(editingKey, editValue);
      }
      setEditingKey(null);
    }
  };
  
  // Function to handle canceling the edit
  const handleCancelEdit = () => {
    setEditingKey(null);
  };
  
  // Function to handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditValue(value);
  };
  
  // Function to handle key press events
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // If no shape is selected, show a message
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

  const shapeName = t(`shapeNames.${selectedShape.type}`);

  return (
    <Card className="w-full bg-white animate-fade-in">
      <CardHeader className="pb-2 flex flex-row items-center space-x-2">
        <ShapeIcon shapeType={selectedShape.type} />
        <CardTitle className="text-sm font-medium">
          {shapeName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(measurements).map(([key, value]) => (
            <MeasurementItem
              key={key}
              measureKey={key}
              value={value}
              shape={selectedShape}
              measurementUnit={measurementUnit}
              editingKey={editingKey}
              editValue={editValue}
              onStartEdit={handleStartEdit}
              onSaveEdit={handleSaveEdit}
              onCancelEdit={handleCancelEdit}
              onInputChange={handleInputChange}
              onKeyPress={handleKeyPress}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MeasurementPanel; 