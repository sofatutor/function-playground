
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Circle, Square, Triangle } from 'lucide-react';
import type { AnyShape, MeasurementUnit } from '@/types/shapes';

interface MeasurementPanelProps {
  selectedShape: AnyShape | null;
  measurements: Record<string, string>;
  measurementUnit: MeasurementUnit;
}

// Localized measurement labels
const measurementLabels: Record<string, { de: string, en: string }> = {
  radius: { de: 'Radius', en: 'Radius' },
  diameter: { de: 'Durchmesser', en: 'Diameter' },
  width: { de: 'Breite', en: 'Width' },
  height: { de: 'Höhe', en: 'Height' },
  side1: { de: 'Seite 1', en: 'Side 1' },
  side2: { de: 'Seite 2', en: 'Side 2' },
  side3: { de: 'Seite 3', en: 'Side 3' },
  area: { de: 'Fläche', en: 'Area' },
  perimeter: { de: 'Umfang', en: 'Perimeter' }
};

const MeasurementPanel: React.FC<MeasurementPanelProps> = ({ 
  selectedShape, 
  measurements, 
  measurementUnit 
}) => {
  if (!selectedShape) {
    return (
      <Card className="w-full bg-white animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Messungen (Measurements)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Wählen Sie eine Form aus, um Messungen anzuzeigen
            <br />
            <span className="text-xs">(Select a shape to view measurements)</span>
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

  // Get localized shape name
  const getShapeName = (type: string): { de: string, en: string } => {
    const shapeNames: Record<string, { de: string, en: string }> = {
      circle: { de: 'Kreis', en: 'Circle' },
      rectangle: { de: 'Rechteck', en: 'Rectangle' },
      triangle: { de: 'Dreieck', en: 'Triangle' }
    };
    return shapeNames[type] || { de: type, en: type };
  };

  // Get unit suffix based on measurement type and selected unit
  const getUnitSuffix = (key: string): string => {
    if (key === 'area') {
      return measurementUnit === 'cm' ? ' cm²' : ' in²';
    } else if (
      key === 'perimeter' || 
      key.includes('side') || 
      key === 'width' || 
      key === 'height' || 
      key === 'radius' || 
      key === 'diameter'
    ) {
      return measurementUnit === 'cm' ? ' cm' : ' in';
    }
    return '';
  };

  const shapeName = getShapeName(selectedShape.type);

  return (
    <Card className="w-full bg-white animate-fade-in">
      <CardHeader className="pb-2 flex flex-row items-center space-x-2">
        <ShapeIcon />
        <CardTitle className="text-sm font-medium">
          {shapeName.de} {/* German shape name first */}
          <span className="text-xs text-muted-foreground ml-1">
            ({shapeName.en})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(measurements).map(([key, value]) => (
            <div key={key} className="flex flex-col">
              <span className="text-xs text-muted-foreground">
                {measurementLabels[key]?.de || key} {/* German label */}
                <span className="text-xs opacity-70">
                  ({measurementLabels[key]?.en || key})
                </span>
              </span>
              <span className="measurement-value font-medium">
                {value}{getUnitSuffix(key)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MeasurementPanel;
