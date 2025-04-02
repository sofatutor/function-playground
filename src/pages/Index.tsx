import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useShapeOperations } from '@/hooks/useShapeOperations';
import { useServiceFactory } from '@/providers/ServiceProvider';
import { useComponentConfig, useGlobalConfig } from '@/context/ConfigContext';
import GeometryHeader from '@/components/GeometryHeader';
import GeometryCanvas from '@/components/GeometryCanvas';
import Toolbar from '@/components/Toolbar';
import UnitSelector from '@/components/UnitSelector';
import FormulaEditor from '@/components/FormulaEditor';
import FunctionSidebar from '@/components/Formula/FunctionSidebar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslate } from '@/utils/translate';
import { Point, ShapeType, OperationMode } from '@/types/shapes';
import { Formula } from '@/types/formula';
import { getStoredPixelsPerUnit } from '@/utils/geometry/common';
import { createDefaultFormula } from '@/utils/formulaUtils';
import ConfigModal from '@/components/ConfigModal';
import ComponentConfigModal from '@/components/ComponentConfigModal';
import { Trash2, Wrench } from 'lucide-react';
import { 
  updateUrlWithData, 
  getFormulasFromUrl,
  getToolFromUrl
} from '@/utils/urlEncoding';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import GlobalControls from '@/components/GlobalControls';
import _UnifiedInfoPanel from '@/components/UnifiedInfoPanel';
import { useViewMode } from '@/contexts/ViewModeContext';
import ParameterControls from '@/components/Formula/ParameterControls';
import { cn } from '@/lib/utils';

const Index = () => {
  // Get the service factory
  const serviceFactory = useServiceFactory();
  const { setComponentConfigModalOpen } = useComponentConfig();
  const { isToolbarVisible, setToolbarVisible, defaultTool } = useGlobalConfig();
  const { isFullscreen, isEmbedded, setIsFullscreen } = useViewMode();
  const isMobile = useIsMobile();
  
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
    updateMeasurement,
    shareCanvasUrl
  } = useShapeOperations();

  const [isFormulaEditorOpen, setIsFormulaEditorOpen] = useState(false);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [selectedFormulaId, setSelectedFormulaId] = useState<string | null>(null);
  const [_pixelsPerUnit, setPixelsPerUnit] = useState<number>(getStoredPixelsPerUnit(measurementUnit));
  
  // Add a ref to track if we've loaded from URL
  const hasLoadedFromUrl = useRef(false);
  // Add a ref for the URL update timeout
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to update pixelsPerUnit when measurement unit changes
  useEffect(() => {
    setPixelsPerUnit(getStoredPixelsPerUnit(measurementUnit));
  }, [measurementUnit]);

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
  
  // Load data from URL on initial mount
  useEffect(() => {
    // Get formulas from URL
    const urlFormulas = getFormulasFromUrl();
    if (urlFormulas) {
      setFormulas(urlFormulas);
      // Select the first formula if in embedded mode so parameter controls will show
      if (isEmbedded && urlFormulas.length > 0) {
        setSelectedFormulaId(urlFormulas[0].id);
      }
    }

    // Get tool from URL
    const urlTool = getToolFromUrl();
    if (urlTool) {
      // Validate that the tool is a valid shape type
      if (['select', 'rectangle', 'circle', 'triangle', 'line', 'function'].includes(urlTool)) {
        // Handle select tool differently - it's a mode, not a shape type
        if (urlTool === 'select') {
          setActiveMode('select');
        } else {
          setActiveShapeType(urlTool as ShapeType);
          setActiveMode(urlTool === 'function' ? 'function' as OperationMode : 'draw' as OperationMode);
        }
      }
    }

    // Mark that we've loaded from URL
    hasLoadedFromUrl.current = true;
  }, [isEmbedded]);

  // Update URL whenever shapes, formulas, grid position, or tool changes
  useEffect(() => {
    if (!hasLoadedFromUrl.current) {
      return;
    }

    if (shapes.length > 0 || formulas.length > 0 || gridPosition || activeShapeType) {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }

      urlUpdateTimeoutRef.current = setTimeout(() => {
        // For select and line tools, we need to handle them differently
        // For select mode, pass 'select' as the tool parameter
        // For all other tools, pass the activeShapeType
        const toolForUrl = activeMode === 'select' ? 'select' : activeShapeType;
        updateUrlWithData(shapes, formulas, gridPosition, toolForUrl);
        urlUpdateTimeoutRef.current = null;
      }, 300);
    }

    return () => {
      if (urlUpdateTimeoutRef.current) {
        clearTimeout(urlUpdateTimeoutRef.current);
      }
    };
  }, [shapes, formulas, gridPosition, activeShapeType, activeMode]);

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
      if (newState && formulas.length === 0 && !hasLoadedFromUrl.current) {
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
  }, [formulas, handleAddFormula, selectedFormulaId, hasLoadedFromUrl]);

  // Auto-open formula editor in embedded mode
  useEffect(() => {
    if (isEmbedded && !isFormulaEditorOpen && formulas.length === 0 && !hasLoadedFromUrl.current) {
      const newFormula = createDefaultFormula('function');
      newFormula.expression = "x*x";
      handleAddFormula(newFormula);
      setIsFormulaEditorOpen(true);
    }
  }, [isEmbedded, isFormulaEditorOpen, formulas.length, handleAddFormula]);

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

  // Set initial tool based on defaultTool from ConfigContext
  useEffect(() => {
    // Only set initial tool based on URL or default when first loading
    // This prevents the defaultTool setting from changing the current tool
    if (!hasLoadedFromUrl.current) {
      const urlTool = getToolFromUrl();
      
      if (urlTool) {
        // Use tool from URL if available
        if (['select', 'rectangle', 'circle', 'triangle', 'line', 'function'].includes(urlTool)) {
          if (urlTool === 'select') {
            setActiveMode('select');
          } else {
            setActiveShapeType(urlTool as ShapeType);
            setActiveMode(urlTool === 'function' ? 'function' as OperationMode : 'create' as OperationMode);
          }
        }
      } else if (defaultTool) {
        // Fall back to defaultTool if no URL parameter
        if (defaultTool === 'select') {
          setActiveMode('select');
        } else if (defaultTool === 'function') {
          setActiveMode('create');
          setIsFormulaEditorOpen(true);
        } else {
          setActiveMode('create');
          setActiveShapeType(defaultTool);
        }
      }
    }
  }, []);

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      {!isEmbedded && (
        <GeometryHeader
          isFullscreen={isFullscreen}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        {!isEmbedded && isToolbarVisible && (
          <Toolbar
            activeMode={activeMode}
            activeShapeType={activeShapeType}
            onModeChange={setActiveMode}
            onShapeTypeChange={setActiveShapeType}
            _onClear={deleteAllShapes}
            _onDelete={() => selectedShapeId && deleteShape(selectedShapeId)}
            hasSelectedShape={!!selectedShapeId}
            _canDelete={!!selectedShapeId}
            onToggleFormulaEditor={toggleFormulaEditor}
            isFormulaEditorOpen={isFormulaEditorOpen}
          />
        )}

        {/* Function Controls - Hide when embedded */}
        {!isEmbedded && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <FormulaEditor
                  formulas={formulas}
                  onAddFormula={handleAddFormula}
                  onUpdateFormula={handleUpdateFormula}
                  onDeleteFormula={handleDeleteFormula}
                  _measurementUnit={measurementUnit}
                  isOpen={true}
                  selectedFormulaId={selectedFormulaId}
                  onSelectFormula={setSelectedFormulaId}
                  onNewFormula={() => {
                    const newFormula = createDefaultFormula('function');
                    newFormula.expression = "x*x";
                    handleAddFormula(newFormula);
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Canvas and Sidebar */}
        <div className="flex-1 flex">
          <div className="flex-1 relative">
            <GeometryCanvas
              shapes={shapes}
              selectedShapeId={selectedShapeId}
              activeMode={activeMode}
              activeShapeType={activeShapeType}
              measurementUnit={measurementUnit}
              gridPosition={gridPosition}
              onGridPositionChange={updateGridPosition}
              onShapeCreate={createShape}
              onShapeSelect={selectShape}
              onShapeMove={moveShape}
              onShapeResize={resizeShape}
              onShapeRotate={rotateShape}
              onShapeDelete={deleteShape}
              onMeasurementUpdate={updateMeasurement}
              formulas={formulas}
              pixelsPerUnit={_pixelsPerUnit}
            />
          </div>

          {/* Function Sidebar - Hide when embedded */}
          {!isEmbedded && (
            <FunctionSidebar
              formulas={formulas}
              selectedFormula={formulas.find(f => f.id === selectedFormulaId) || null}
              onAddFormula={() => {
                const newFormula = createDefaultFormula('function');
                newFormula.expression = "x*x";
                handleAddFormula(newFormula);
              }}
              onDeleteFormula={handleDeleteFormula}
              onSelectFormula={(formula) => setSelectedFormulaId(formula.id)}
              onUpdateFormula={handleUpdateFormula}
              measurementUnit={measurementUnit}
              className={cn(
                'w-80',
                isFormulaEditorOpen ? 'block' : 'hidden',
                isMobile ? 'fixed inset-y-0 right-0 z-50' : ''
              )}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
            />
          )}
        </div>

        {/* Parameter Controls */}
        <ParameterControls
          selectedFormula={formulas.find(f => f.id === selectedFormulaId) || null}
          onUpdateFormula={handleUpdateFormula}
        />
      </div>

      {/* Global Config Menu */}
      {!isEmbedded && (
        <GlobalControls
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onShare={shareCanvasUrl}
        />
      )}

      {/* Component Config Modal */}
      <ComponentConfigModal />
    </div>
  );
};

export default Index;
