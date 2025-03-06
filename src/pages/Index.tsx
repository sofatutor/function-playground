import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useShapeOperations } from '@/hooks/useShapeOperations';
import { useServiceFactory } from '@/providers/ServiceProvider';
import { useComponentConfig } from '@/context/ConfigContext';
import GeometryHeader from '@/components/GeometryHeader';
import GeometryCanvas from '@/components/GeometryCanvas';
import Toolbar from '@/components/Toolbar';
import UnitSelector from '@/components/UnitSelector';
import FormulaEditor from '@/components/FormulaEditor';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslate } from '@/utils/translate';
import { Point } from '@/types/shapes';
import { Formula } from '@/types/formula';
import { getStoredPixelsPerUnit } from '@/utils/geometry/common';
import { createDefaultFormula } from '@/utils/formulaUtils';
import ConfigModal from '@/components/ConfigModal';
import ComponentConfigModal from '@/components/ComponentConfigModal';
import { Settings, Trash2, Wrench, PlusCircle } from 'lucide-react';
import { 
  updateUrlWithData, 
  getShapesFromUrl, 
  getGridPositionFromUrl,
  getFormulasFromUrl
} from '@/utils/urlEncoding';
import { toast } from 'sonner';

const Index = () => {
  // Get the service factory
  const serviceFactory = useServiceFactory();
  const { setComponentConfigModalOpen } = useComponentConfig();
  
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
  
  // Add a ref to track if we've loaded from URL
  const hasLoadedFromUrl = useRef(false);
  // Add a ref for the URL update timeout
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Function to request fullscreen with better mobile support
  const requestFullscreen = useCallback(() => {
    const elem = document.documentElement;
    
    // Try different fullscreen methods for better cross-browser and mobile support
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
        // Try alternative approach for iOS
        if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
          // For iOS, we can use a different approach
          document.body.style.position = 'fixed';
          document.body.style.top = '0';
          document.body.style.left = '0';
          document.body.style.width = '100%';
          document.body.style.height = '100%';
          document.body.style.zIndex = '9999';
          setIsFullscreen(true);
        }
      });
    } else if ('webkitRequestFullscreen' in elem) {
      // Use type assertion with a more specific type
      (elem as HTMLElement & { webkitRequestFullscreen(): Promise<void> }).webkitRequestFullscreen();
    } else if ('msRequestFullscreen' in elem) {
      // Use type assertion with a more specific type
      (elem as HTMLElement & { msRequestFullscreen(): Promise<void> }).msRequestFullscreen();
    } else {
      // Fallback for devices that don't support fullscreen API
      document.body.style.position = 'fixed';
      document.body.style.top = '0';
      document.body.style.left = '0';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.zIndex = '9999';
      setIsFullscreen(true);
    }
  }, []);

  // Function to exit fullscreen with better mobile support
  const exitFullscreen = useCallback(() => {
    if (document.exitFullscreen) {
      document.exitFullscreen().catch(err => {
        console.error(`Error attempting to exit fullscreen: ${err.message}`);
      });
    } else if ('webkitExitFullscreen' in document) {
      // Use type assertion with a more specific type
      (document as Document & { webkitExitFullscreen(): Promise<void> }).webkitExitFullscreen();
    } else if ('msExitFullscreen' in document) {
      // Use type assertion with a more specific type
      (document as Document & { msExitFullscreen(): Promise<void> }).msExitFullscreen();
    }
    
    // Reset any manual fullscreen styles we might have applied
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.body.style.zIndex = '';
    
    // If we're using the fallback approach, manually set fullscreen state
    if (!document.fullscreenElement && 
        !('webkitFullscreenElement' in document) && 
        !('msFullscreenElement' in document)) {
      setIsFullscreen(false);
    }
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      requestFullscreen();
    } else {
      exitFullscreen();
    }
  }, [isFullscreen, requestFullscreen, exitFullscreen]);
  
  // Load formulas from URL when component mounts
  useEffect(() => {
    if (hasLoadedFromUrl.current) {
      return;
    }

    // Load formulas from URL
    const formulasFromUrl = getFormulasFromUrl();
    if (formulasFromUrl && formulasFromUrl.length > 0) {
      setFormulas(formulasFromUrl);
      setSelectedFormulaId(formulasFromUrl[0].id);
      setIsFormulaEditorOpen(true);
      toast.success(`Loaded ${formulasFromUrl.length} formulas from URL`);
    }

    // Mark as loaded from URL
    hasLoadedFromUrl.current = true;
  }, []);
  
  // Update URL whenever shapes, formulas, or grid position change, but only after initial load
  useEffect(() => {
    if (!hasLoadedFromUrl.current) {
      return;
    }

    if (shapes.length > 0 || formulas.length > 0 || gridPosition) {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }

      urlUpdateTimeoutRef.current = setTimeout(() => {
        updateUrlWithData(shapes, formulas, gridPosition);
        urlUpdateTimeoutRef.current = null;
      }, 300);
    }

    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }
    };
  }, [shapes, formulas, gridPosition]);

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
      } else if (!newState) {
        // If closing the editor, we should clear the selected formula to prevent auto-reopening
        setSelectedFormulaId(null);
      }
      
      return newState;
    });
  }, [formulas.length, handleAddFormula, selectedFormulaId]);

  // Open formula editor when a formula is selected (e.g., by clicking a point on the graph)
  useEffect(() => {
    // If a formula is selected but the editor is not open, open it
    // But only if the selection wasn't triggered by the toggle function
    if (selectedFormulaId && !isFormulaEditorOpen) {
      // This is typically triggered when clicking on a formula point in the graph
      setIsFormulaEditorOpen(true);
    }
  }, [selectedFormulaId, isFormulaEditorOpen]);

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
    <div className={`min-h-screen bg-gray-50 ${isFullscreen ? 'p-0' : ''}`}>
      <div className={`${isFullscreen ? 'max-w-full p-0' : 'container py-0 sm:py-2 md:py-4 lg:py-8 px-0 sm:px-2 md:px-4'} transition-all duration-200 h-[calc(100vh-0rem)] sm:h-[calc(100vh-0.5rem)]`}>
        <GeometryHeader isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen} />
        
        {/* Include both modals */}
        <ConfigModal />
        <ComponentConfigModal />
        
        <div className="h-[calc(100%-3rem)] sm:h-[calc(100%-4rem)]">
          <div className="h-full">
            <div className="flex flex-col h-full">
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between ${isFullscreen ? 'space-y-1 sm:space-y-0 sm:space-x-1 px-1' : 'space-y-1 sm:space-y-0 sm:space-x-2 px-1 sm:px-2'} mb-1 sm:mb-2`}>
                <div className="flex flex-row items-center space-x-1 sm:space-x-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
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
                </div>
              </div>
              
              {isFormulaEditorOpen && (
                <div className="mb-1 sm:mb-2 md:mb-3">
                  <FormulaEditor
                    formulas={formulas}
                    onAddFormula={handleAddFormula}
                    onUpdateFormula={handleUpdateFormula}
                    onDeleteFormula={handleDeleteFormula}
                    measurementUnit={measurementUnit}
                    isOpen={isFormulaEditorOpen}
                    selectedFormulaId={selectedFormulaId}
                    onSelectFormula={setSelectedFormulaId}
                    onNewFormula={() => {
                      const newFormula = createDefaultFormula('function');
                      newFormula.expression = "x*x";
                      handleAddFormula(newFormula);
                    }}
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
                onShapeDelete={deleteShape}
                onModeChange={setActiveMode}
                onMoveAllShapes={handleMoveAllShapes}
                onGridPositionChange={handleGridPositionChange}
                serviceFactory={serviceFactory}
                onMeasurementUpdate={updateMeasurement}
                onFormulaSelect={setSelectedFormulaId}
                canvasTools={
                  <div className="absolute top-2 right-2 z-10 flex space-x-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 bg-white/80 backdrop-blur-sm"
                            onClick={deleteAllShapes}
                          >
                            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('clearCanvas')}</p>
                        </TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 bg-white/80 backdrop-blur-sm"
                            onClick={() => setComponentConfigModalOpen(true)}
                          >
                            <Wrench className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('componentConfigModal.openButton')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    {/* Add UnitSelector here */}
                    <div className="bg-white/80 backdrop-blur-sm rounded-md">
                      <UnitSelector
                        value={measurementUnit}
                        onChange={setMeasurementUnit}
                        compact={true}
                      />
                    </div>
                  </div>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
