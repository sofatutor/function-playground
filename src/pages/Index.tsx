import React from 'react';
import { useShapeOperations } from '@/hooks/useShapeOperations';
import GeometryHeader from '@/components/GeometryHeader';
import GeometryCanvas from '@/components/GeometryCanvas';
import Toolbar from '@/components/Toolbar';
import MeasurementPanel from '@/components/MeasurementPanel';
import UnitSelector from '@/components/UnitSelector';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Triangle, Circle, Square } from 'lucide-react';
import { useTranslate } from '@/utils/translate';

const Index = () => {
  const {
    shapes,
    selectedShapeId,
    activeMode,
    activeShapeType,
    measurementUnit,
    setMeasurementUnit,
    createShape,
    selectShape,
    moveShape,
    resizeShape,
    rotateShape,
    deleteShape,
    deleteAllShapes,
    setActiveMode,
    setActiveShapeType,
    getShapeMeasurements,
    getSelectedShape
  } = useShapeOperations();

  const selectedShape = getSelectedShape();
  const measurements = selectedShape ? getShapeMeasurements(selectedShape) : {};
  const t = useTranslate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8">
        <GeometryHeader />
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 sm:space-x-2">
                <Toolbar
                  activeMode={activeMode}
                  activeShapeType={activeShapeType}
                  onModeChange={setActiveMode}
                  onShapeTypeChange={setActiveShapeType}
                  onClear={deleteAllShapes}
                  onDelete={() => selectedShapeId && deleteShape(selectedShapeId)}
                  hasSelectedShape={!!selectedShapeId}
                  canDelete={!!selectedShapeId}
                />
                
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={deleteAllShapes}
                  className="text-sm"
                >
                  {t('clearCanvas')}
                </Button>
              </div>
              
              <GeometryCanvas
                shapes={shapes}
                selectedShapeId={selectedShapeId}
                activeMode={activeMode}
                measurementUnit={measurementUnit}
                onShapeSelect={selectShape}
                onShapeCreate={createShape}
                onShapeMove={moveShape}
                onShapeResize={resizeShape}
                onShapeRotate={rotateShape}
              />
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="flex flex-col space-y-4">
              <Card className="p-4">
                <UnitSelector
                  value={measurementUnit}
                  onChange={setMeasurementUnit}
                />
              </Card>
              
              <MeasurementPanel
                selectedShape={selectedShape}
                measurements={measurements}
                measurementUnit={measurementUnit}
              />
              
              <Card className="p-4">
                <h3 className="text-sm font-medium mb-2">{t('gettingStarted')}</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center space-x-2">
                    <Square size={16} className="text-geometry-primary" />
                    <span>{t('selectShapeTool')}</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Circle size={16} className="text-geometry-primary" />
                    <span>{t('clickAndDrag')}</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <Triangle size={16} className="text-geometry-primary" />
                    <span>{t('useControls')}</span>
                  </li>
                </ul>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
