import React, { useState, useEffect, useCallback } from 'react';
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
import { Point } from '@/types/shapes';

const Index = () => {
  const {
    shapes,
    selectedShapeId,
    activeMode,
    activeShapeType,
    measurementUnit,
    gridPosition,
    updateGridPosition,
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
    getSelectedShape,
    updateMeasurement
  } = useShapeOperations();

  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check fullscreen status
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const selectedShape = getSelectedShape();
  
  // Convert measurements from numbers to strings
  const rawMeasurements = selectedShape ? getShapeMeasurements(selectedShape) : {};
  const measurements: Record<string, string> = {};
  
  // Convert each measurement to a string
  Object.entries(rawMeasurements).forEach(([key, value]) => {
    measurements[key] = value.toString();
  });

  const t = useTranslate();

  // Inside the Index component, add a function to handle moving all shapes
  const handleMoveAllShapes = useCallback((dx: number, dy: number) => {
    // Move each shape by the specified delta
    shapes.forEach(shape => {
      const newPosition = {
        x: shape.position.x + dx,
        y: shape.position.y + dy
      };
      moveShape(shape.id, newPosition);
    });
  }, [shapes, moveShape]);

  // Handle grid position changes
  const handleGridPositionChange = useCallback((newPosition: Point) => {
    console.log('Index: Grid position changed:', newPosition);
    updateGridPosition(newPosition);
  }, [updateGridPosition]);

  return (
    <div className={`min-h-screen bg-gray-50 ${isFullscreen ? 'p-2' : ''}`}>
      <div className={`${isFullscreen ? 'max-w-full p-2' : 'container py-8'} transition-all duration-200 h-[calc(100vh-2rem)]`}>
        <GeometryHeader isFullscreen={isFullscreen} />
        
        <div className={`grid ${isFullscreen ? 'grid-cols-12 gap-2' : 'grid-cols-1 lg:grid-cols-4 gap-6'} h-[calc(100%-4rem)]`}>
          <div className={`${isFullscreen ? 'col-span-10' : 'lg:col-span-3'} h-full`}>
            <div className="flex flex-col h-full">
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between ${isFullscreen ? 'space-y-1 sm:space-y-0 sm:space-x-1' : 'space-y-2 sm:space-y-0 sm:space-x-2'} mb-2`}>
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
                activeShapeType={activeShapeType}
                measurementUnit={measurementUnit}
                isFullscreen={isFullscreen}
                onShapeSelect={selectShape}
                onShapeCreate={createShape}
                onShapeMove={moveShape}
                onShapeResize={resizeShape}
                onShapeRotate={rotateShape}
                onModeChange={setActiveMode}
                onMoveAllShapes={handleMoveAllShapes}
                gridPosition={gridPosition}
                onGridPositionChange={handleGridPositionChange}
              />
            </div>
          </div>
          
          <div className={`${isFullscreen ? 'col-span-2' : 'lg:col-span-1'}`}>
            <div className={`flex flex-col ${isFullscreen ? 'space-y-2' : 'space-y-4'}`}>
              <Card className={`${isFullscreen ? 'p-2' : 'p-4'}`}>
                <UnitSelector
                  value={measurementUnit}
                  onChange={setMeasurementUnit}
                />
              </Card>
              
              <MeasurementPanel
                selectedShape={selectedShape}
                measurements={measurements}
                measurementUnit={measurementUnit}
                onMeasurementUpdate={updateMeasurement}
              />
              
              {!isFullscreen && (
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
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
