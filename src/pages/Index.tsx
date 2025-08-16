import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useShapeOperations } from '@/hooks/useShapeOperations';
import { useServiceFactory } from '@/providers/ServiceProvider';
import { useComponentConfig, useConfig } from '@/context/ConfigContext';
import { useShareViewOptions } from '@/contexts/ShareViewOptionsContext';
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
import { Trash2, Wrench, Maximize2, Minimize2 } from 'lucide-react';
import { 
  updateUrlWithData, 
  getFormulasFromUrl,
  applyShareViewOptionsWithPanelState
} from '@/utils/urlEncoding';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import GlobalControls from '@/components/GlobalControls';
import _UnifiedInfoPanel from '@/components/UnifiedInfoPanel';

const Index = () => {
  // Get the service factory
  const serviceFactory = useServiceFactory();
  const { setComponentConfigModalOpen } = useComponentConfig();
  const { setLanguage } = useConfig();
  const isMobile = useIsMobile();
  
  // Get ShareViewOptions with applied precedence
  const { shareViewOptions, isSharePanelOpen } = useShareViewOptions();
  const appliedOptions = applyShareViewOptionsWithPanelState(shareViewOptions, isSharePanelOpen);
  
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
  } = useShapeOperations({ showToasts: appliedOptions.layout !== 'noninteractive' });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [isFormulaEditorOpen, setIsFormulaEditorOpen] = useState(false);
  const [selectedFormulaId, setSelectedFormulaId] = useState<string | null>(null);
  const [_pixelsPerUnit, setPixelsPerUnit] = useState<number>(getStoredPixelsPerUnit(measurementUnit));
  
  // Add a ref to track if we've loaded from URL
  const hasLoadedFromUrl = useRef(false);
  // Add a ref for the URL update timeout
  const urlUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to apply language from ShareViewOptions
  useEffect(() => {
    if (appliedOptions.lang && appliedOptions.lang !== 'en') {
      setLanguage(appliedOptions.lang);
    }
  }, [appliedOptions.lang, setLanguage]);

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
      if (appliedOptions.layout !== 'noninteractive') {
        toast.success(`Loaded ${formulasFromUrl.length} formulas from URL`);
      }
    }

    // Mark as loaded from URL
    hasLoadedFromUrl.current = true;
  }, [appliedOptions.layout, formulas.length]);
  
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
  }, [formulas, handleAddFormula, selectedFormulaId]);

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
    <div className={`min-h-screen bg-gray-50 ${isFullscreen || isMobile ? 'p-0' : ''}`}>
      <div className={`${isFullscreen || isMobile ? 'max-w-full p-0' : 'container py-0 sm:py-2 md:py-4 lg:py-8 px-0 sm:px-2 md:px-4'} transition-all duration-200 h-[calc(100vh-0rem)] sm:h-[calc(100vh-0.5rem)]`}>
        {/* Header - hidden if header option is false */}
        {appliedOptions.header && (
          <GeometryHeader isFullscreen={isFullscreen} />
        )}
        
        {/* Include both modals - hidden in noninteractive mode */}
        {appliedOptions.layout !== 'noninteractive' && (
          <>
            <ConfigModal />
            <ComponentConfigModal />
          </>
        )}
        
        <div className={`${isMobile || isFullscreen ? 'h-full' : 'h-[calc(100%-3rem)] sm:h-[calc(100%-4rem)]'}`}>
          <div className="h-full">
            <div className="flex flex-col h-full">
              {/* Toolbar and controls - hidden in noninteractive mode */}
              {appliedOptions.layout !== 'noninteractive' && (
                <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between ${isFullscreen || isMobile ? 'space-y-1 sm:space-y-0 sm:space-x-1 px-1' : 'space-y-1 sm:space-y-0 sm:space-x-2 px-1 sm:px-2'} ${isMobile ? 'mb-0' : 'mb-1 sm:mb-2'}`}>
                  <div className="flex flex-row items-center space-x-1 sm:space-x-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
                    {/* Show Toolbar only if tools are enabled */}
                    {appliedOptions.tools && (
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
                        showFunctionControls={appliedOptions.funcControls}
                      />
                    )}
                  </div>
                  
                  {/* Admin controls and fullscreen button grouped together on the right */}
                  <div className="flex items-center space-x-1">
                    {/* Settings button - always visible when SharePanel is open or when admin is enabled */}
                    {(isSharePanelOpen || appliedOptions.admin) && (
                      <GlobalControls 
                        isFullscreen={isFullscreen} 
                        onToggleFullscreen={toggleFullscreen}
                        showFullscreenButton={false}
                        showZoomControls={appliedOptions.zoom}
                        showAdminControls={isSharePanelOpen || appliedOptions.admin}
                      />
                    )}
                    
                    {/* Fullscreen button */}
                    {appliedOptions.fullscreen && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={toggleFullscreen}
                              className="h-9 w-9"
                            >
                              {isFullscreen ? (
                                <Minimize2 className="h-4 w-4" />
                              ) : (
                                <Maximize2 className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{isFullscreen ? t('exitFullscreen') : t('enterFullscreen')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              )}
              
              {/* Formula editor - hidden in noninteractive mode or when funcControls is disabled */}
              {appliedOptions.layout !== 'noninteractive' && appliedOptions.funcControls && isFormulaEditorOpen && (
                <div className="w-full mb-1 sm:mb-2 md:mb-3">
                  <FormulaEditor
                    formulas={formulas}
                    onAddFormula={handleAddFormula}
                    onUpdateFormula={handleUpdateFormula}
                    onDeleteFormula={handleDeleteFormula}
                    _measurementUnit={measurementUnit}
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
                isNonInteractive={appliedOptions.layout === 'noninteractive'}
                showZoomControls={appliedOptions.zoom}
                canvasTools={
                  // Hide canvas tools in noninteractive mode
                  appliedOptions.layout !== 'noninteractive' ? (
                    <div className="absolute top-2 right-2 z-10 flex space-x-1">
                      <TooltipProvider>
                        {/* Clear button - hide if tools are disabled */}
                        {appliedOptions.tools && (
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
                        )}
                        
                        {/* Config button - hide if tools are disabled */}
                        {appliedOptions.tools && (
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
                        )}
                      </TooltipProvider>
                      
                      {/* UnitSelector - show only if unitCtl is enabled */}
                      {appliedOptions.unitCtl && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-md">
                          <UnitSelector
                            value={measurementUnit}
                            onChange={setMeasurementUnit}
                            compact={true}
                          />
                        </div>
                      )}
                    </div>
                  ) : null
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
