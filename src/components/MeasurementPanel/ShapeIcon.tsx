import React from 'react';
import { Circle, Square, Triangle } from 'lucide-react';
import { ShapeType } from '@/types/shapes';

interface ShapeIconProps {
  shapeType: ShapeType;
}

const ShapeIcon: React.FC<ShapeIconProps> = ({ shapeType }) => {
  switch (shapeType) {
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

export default ShapeIcon; 