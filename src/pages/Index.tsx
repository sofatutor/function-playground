import React, { useState, useEffect, useCallback } from 'react';
import { useShapeOperations } from '@/hooks/useShapeOperations';
import { useServiceFactory } from '@/providers/ServiceProvider';
import GeometryHeader from '@/components/GeometryHeader';
import GeometryCanvas from '@/components/GeometryCanvas';
import Toolbar from '@/components/Toolbar';
import UnitSelector from '@/components/UnitSelector';
import FormulaEditor from '@/components/FormulaEditor';
import { Button } from '@/components/ui/button';
import { useTranslate } from '@/utils/translate';
import { Point } from '@/types/shapes';
import { Formula } from '@/types/formula';
import { getStoredPixelsPerUnit } from '@/utils/geometry/common';
import { createDefaultFormula } from '@/utils/formulaUtils';

const Index = () => {
  // Get the service factory
  const serviceFactory = useServiceFactory();
  
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
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [isFormulaEditorOpen, setIsFormulaEditorOpen] = useState(false);
  const [selectedFormulaId, setSelectedFormulaId] = useState<string | null>(null);
  const [pixelsPerUnit, setPixelsPerUnit] = useState<number>(getStoredPixelsPerUnit(measurementUnit));

  // Effect to update pixelsPerUnit when measurement unit changes
  useEffect(() => {
    setPixelsPerUnit(getStoredPixelsPerUnit(measurementUnit));
  }, [measurementUnit]);

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

  // Handle formula operations
  const handleAddFormula = useCallback((formula: Formula) => {
    console.log('Adding formula:', formula);
    setFormulas(prevFormulas => [...prevFormulas, formula]);
    setSelectedFormulaId(formula.id);
  }, []);

  const handleUpdateFormula = useCallback((id: string, updates: Partial<Formula>) => {
    setFormulas(prevFormulas => 
      prevFormulas.map(formula => 
        formula.id === id ? { ...formula, ...updates } : formula
      )
    );
  }, []);

  const handleDeleteFormula = useCallback((id: string) => {
    setFormulas(prevFormulas => {
      const updatedFormulas = prevFormulas.filter(formula => formula.id !== id);
      
      // If the last formula was deleted and the formula editor is open,
      // switch back to the shape selection tool
      if (updatedFormulas.length === 0 && isFormulaEditorOpen) {
        setActiveMode('select');
        setSelectedFormulaId(null);
      } else if (id === selectedFormulaId && updatedFormulas.length > 0) {
        // If the selected formula was deleted, select the first available formula
        setSelectedFormulaId(updatedFormulas[0].id);
      }
      
      return updatedFormulas;
    });
  }, [isFormulaEditorOpen, setActiveMode, selectedFormulaId]);

  // Toggle formula editor
  const toggleFormulaEditor = useCallback(() => {
    setIsFormulaEditorOpen(prevState => {
      const newState = !prevState;
      
      // If opening the formula editor and there are no formulas, create a default one
      if (newState && formulas.length === 0) {
        const newFormula = createDefaultFormula('function');
        // Set a default expression of x^2 instead of empty
        newFormula.expression = "x*x";
        handleAddFormula(newFormula);
      } else if (newState && formulas.length > 0 && !selectedFormulaId) {
        // If opening and there are formulas but none selected, select the first one
        setSelectedFormulaId(formulas[0].id);
      }
      
      return newState;
    });
  }, [formulas.length, handleAddFormula, selectedFormulaId]);

  const selectedShape = getSelectedShape();
  
  // Convert measurements from numbers to strings with proper formatting
  const rawMeasurements = selectedShape ? getShapeMeasurements(selectedShape) : {};
  const measurements: Record<string, string> = {};
  
  // Format each measurement properly
  Object.entries(rawMeasurements).forEach(([key, value]) => {
    // For angles, display as integers
    if (key.startsWith('angle')) {
      measurements[key] = Math.round(value).toString();
    } else {
      // For all other measurements, ensure they have at most 2 decimal places
      measurements[key] = value.toFixed(2);
    }
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
        
        <div className="h-[calc(100%-4rem)]">
          <div className="h-full">
            <div className="flex flex-col h-full">
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between ${isFullscreen ? 'space-y-1 sm:space-y-0 sm:space-x-1' : 'space-y-2 sm:space-y-0 sm:space-x-2'} mb-2`}>
                <div className="flex flex-row items-center space-x-2">
                  <Toolbar
                    activeMode={activeMode}
                    activeShapeType={activeShapeType}
                    onModeChange={setActiveMode}
                    onShapeTypeChange={setActiveShapeType}
                    onClear={deleteAllShapes}
                    onDelete={() => selectedShapeId && deleteShape(selectedShapeId)}
                    hasSelectedShape={!!selectedShapeId}
                    canDelete={!!selectedShapeId}
                    onToggleFormulaEditor={toggleFormulaEditor}
                    isFormulaEditorOpen={isFormulaEditorOpen}
                  />
                  
                  <div className="h-8 w-px bg-gray-200 mx-1" />
                  
                  <div className="w-24">
                    <UnitSelector
                      value={measurementUnit}
                      onChange={setMeasurementUnit}
                    />
                  </div>
                </div>
                
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={deleteAllShapes}
                  className="text-sm"
                >
                  {t('clearCanvas')}
                </Button>
              </div>
              
              {isFormulaEditorOpen && (
                <div className="mb-4">
                  <FormulaEditor
                    formulas={formulas}
                    onAddFormula={handleAddFormula}
                    onUpdateFormula={handleUpdateFormula}
                    onDeleteFormula={handleDeleteFormula}
                    measurementUnit={measurementUnit}
                    isOpen={isFormulaEditorOpen}
                    selectedFormulaId={selectedFormulaId}
                    onSelectFormula={setSelectedFormulaId}
                  />
                </div>
              )}
              
              <GeometryCanvas
                shapes={shapes}
                formulas={formulas}
                selectedShapeId={selectedShapeId}
                activeMode={activeMode}
                activeShapeType={activeShapeType}
                measurementUnit={measurementUnit}
                isFullscreen={isFullscreen}
                gridPosition={gridPosition}
                onShapeSelect={selectShape}
                onShapeCreate={createShape}
                onShapeMove={moveShape}
                onShapeResize={resizeShape}
                onShapeRotate={rotateShape}
                onModeChange={setActiveMode}
                onMoveAllShapes={handleMoveAllShapes}
                onGridPositionChange={handleGridPositionChange}
                serviceFactory={serviceFactory}
                onMeasurementUpdate={updateMeasurement}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
