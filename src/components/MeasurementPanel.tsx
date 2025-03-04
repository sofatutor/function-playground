
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Circle, Square, Triangle } from 'lucide-react';
import type { AnyShape } from '@/types/shapes';

interface MeasurementPanelProps {
  selectedShape: AnyShape | null;
  measurements: Record<string, string>;
}

const MeasurementPanel: React.FC<MeasurementPanelProps> = ({ selectedShape, measurements }) => {
  if (!selectedShape) {
    return (
      <Card className="w-full bg-white animate-fade-in">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Measurements</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Select a shape to view measurements</p>
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

  return (
    <Card className="w-full bg-white animate-fade-in">
      <CardHeader className="pb-2 flex flex-row items-center space-x-2">
        <ShapeIcon />
        <CardTitle className="text-sm font-medium">
          {selectedShape.type.charAt(0).toUpperCase() + selectedShape.type.slice(1)} Measurements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(measurements).map(([key, value]) => (
            <div key={key} className="flex flex-col">
              <span className="text-xs capitalize text-muted-foreground">
                {key}
              </span>
              <span className="measurement-value font-medium">
                {value}{key === 'area' ? ' units²' : key === 'perimeter' || key.includes('side') || key === 'width' || key === 'height' || key === 'radius' || key === 'diameter' ? ' units' : ''}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MeasurementPanel;
