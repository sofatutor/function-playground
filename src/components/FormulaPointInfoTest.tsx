import React, { useState, useEffect } from 'react';
import { Formula, FormulaPoint } from '@/types/formula';
import { Point, MeasurementUnit } from '@/types/shapes';
import FormulaGraph from './FormulaGraph';
import FormulaPointInfo from './FormulaPointInfo';
import { Card, CardContent } from './ui/card';
import { useTranslate } from '@/utils/translate';

// Define an extended FormulaPoint type that includes the additional properties
interface ExtendedFormulaPoint extends FormulaPoint {
  mathX: number;
  mathY: number;
  formula: Formula;
  navigationStepSize?: number;
}

const FormulaPointInfoTest: React.FC = () => {
  const t = useTranslate();
  const [selectedPoint, setSelectedPoint] = useState<ExtendedFormulaPoint | null>(null);
  const [measurementUnit] = useState<MeasurementUnit>('cm');
  const pixelsPerUnit = 50;

  // Sample formulas for testing multiple functions
  const testFormulas: Formula[] = [
    {
      id: 'sine-formula',
      type: 'function',
      expression: 'Math.sin(x)',
      color: '#ff0000',
      strokeWidth: 2,
      xRange: [-10, 10],
      samples: 500,
      scaleFactor: 1.0
    },
    {
      id: 'cosine-formula',
      type: 'function',
      expression: 'Math.cos(x)',
      color: '#0000ff',
      strokeWidth: 2,
      xRange: [-10, 10],
      samples: 500,
      scaleFactor: 1.0
    },
    {
      id: 'parabola-formula',
      type: 'function',
      expression: 'x * x / 4',
      color: '#00aa00',
      strokeWidth: 2,
      xRange: [-10, 10],
      samples: 500,
      scaleFactor: 1.0
    }
  ];

  const gridPosition: Point = {
    x: 400, // Center x position
    y: 300  // Center y position
  };

  const handlePointSelect = (point: ExtendedFormulaPoint | null) => {
    setSelectedPoint(point);
  };

  // Global click handler to clear selection
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      // Check if the click is on a path (part of the graph)
      if ((e.target as Element).tagName === 'path') {
        return;
      }
      
      // Check if the click is on the info box
      const infoBox = document.querySelector('.point-info-box');
      if (infoBox && infoBox.contains(e.target as Node)) {
        return;
      }
      
      // Otherwise, clear the selection
      setSelectedPoint(null);
    };
    
    document.addEventListener('click', handleGlobalClick);
    
    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  return (
    <div className="relative w-full h-[600px] border border-gray-200 rounded-lg">
      <svg width="100%" height="100%">
        {testFormulas.map((formula) => (
          <FormulaGraph
            key={formula.id}
            formula={formula}
            gridPosition={gridPosition}
            pixelsPerUnit={pixelsPerUnit}
            onPointSelect={handlePointSelect}
            globalSelectedPoint={selectedPoint}
          />
        ))}
      </svg>

      {selectedPoint && (
        <div className="absolute bottom-4 right-4 w-80 point-info-box">
          <FormulaPointInfo 
            point={selectedPoint} 
            gridPosition={gridPosition}
            pixelsPerUnit={pixelsPerUnit}
            measurementUnit={measurementUnit}
          />
        </div>
      )}

      <div className="absolute top-4 left-4 instruction-card">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm">{t('clickOnCurveInstruction')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FormulaPointInfoTest; 