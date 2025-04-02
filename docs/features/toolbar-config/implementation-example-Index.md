# Implementation Example: Index Component Updates

This document shows the implementation example for updating the `Index.tsx` component to integrate the toolbar visibility and default tool configuration.

## Conditionally Rendering the Toolbar

```typescript
// src/pages/Index.tsx

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useShapeOperations } from '@/hooks/useShapeOperations';
import { useServiceFactory } from '@/providers/ServiceProvider';
import { useComponentConfig, useGlobalConfig } from '@/context/ConfigContext'; // Add useGlobalConfig
import GeometryHeader from '@/components/GeometryHeader';
import GeometryCanvas from '@/components/GeometryCanvas';
import Toolbar from '@/components/Toolbar';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye } from 'lucide-react'; // Add Eye icon for toolbar toggle
// ... other imports

const Index = () => {
  // Get the service factory and configs
  const serviceFactory = useServiceFactory();
  const { setComponentConfigModalOpen } = useComponentConfig();
  const { isToolbarVisible, setToolbarVisible, defaultTool } = useGlobalConfig(); // Get toolbar config
  const isMobile = useIsMobile();
  
  // ... existing hooks and state ...

  // Initialize with the default tool on component mount
  useEffect(() => {
    if (defaultTool && defaultTool !== activeShapeType && defaultTool !== 'function') {
      // If default tool is a shape type
      setActiveMode('create');
      setActiveShapeType(defaultTool as ShapeType);
    } else if (defaultTool === 'select') {
      // If default tool is select
      setActiveMode('select');
    } else if (defaultTool === 'function' && !isFormulaEditorOpen) {
      // If default tool is function and formula editor isn't open
      toggleFormulaEditor();
    }
  }, [defaultTool]); // Only run on initial mount and when defaultTool changes

  // ... existing functions and handlers ...

  // Add a toggle function for the toolbar
  const toggleToolbarVisibility = useCallback(() => {
    setToolbarVisible(!isToolbarVisible);
  }, [isToolbarVisible, setToolbarVisible]);

  return (
    <div className={`min-h-screen bg-gray-50 ${isFullscreen || isMobile ? 'p-0' : ''}`}>
      <div className={`${isFullscreen || isMobile ? 'max-w-full p-0' : 'container py-0 sm:py-2 md:py-4 lg:py-8 px-0 sm:px-2 md:px-4'} transition-all duration-200 h-[calc(100vh-0rem)] sm:h-[calc(100vh-0.5rem)]`}>
        <GeometryHeader isFullscreen={isFullscreen} />
        
        {/* Include both modals */}
        <ConfigModal />
        <ComponentConfigModal />
        
        <div className={`${isMobile || isFullscreen ? 'h-full' : 'h-[calc(100%-3rem)] sm:h-[calc(100%-4rem)]'}`}>
          <div className="h-full">
            <div className="flex flex-col h-full">
              <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between ${isFullscreen || isMobile ? 'space-y-1 sm:space-y-0 sm:space-x-1 px-1' : 'space-y-1 sm:space-y-0 sm:space-x-2 px-1 sm:px-2'} ${isMobile ? 'mb-0' : 'mb-1 sm:mb-2'}`}>
                
                {/* Conditionally render toolbar based on isToolbarVisible */}
                {isToolbarVisible ? (
                  <div className="flex flex-row items-center space-x-1 sm:space-x-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
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
                  </div>
                ) : (
                  /* When toolbar is hidden, show a minimal toggle button */
                  <div className="flex items-center">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={toggleToolbarVisibility}
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            aria-label={t('showToolbar')}
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" align="center">
                          <p>{t('showToolbar')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
                
                <GlobalControls 
                  isFullscreen={isFullscreen} 
                  onToggleFullscreen={toggleFullscreen}
                  onShare={shareCanvasUrl}
                />
              </div>
              
              {/* Rest of the component... */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
```

## Adding Translation Keys

```typescript
// en.json (English example)
{
  // Existing translations...
  "showToolbar": "Show Toolbar",
  "hideToolbar": "Hide Toolbar"
  // ...
}
```

## Additional Enhancements

For a smoother user experience when the toolbar is hidden, consider:

1. **Adding a keyboard shortcut to toggle the toolbar:**

```typescript
// Add an effect to handle keyboard shortcuts
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ctrl+T to toggle toolbar
    if (e.ctrlKey && e.key === 't') {
      e.preventDefault();
      toggleToolbarVisibility();
    }
    // ... other keyboard shortcuts
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}, [toggleToolbarVisibility]);
```

2. **Make the toggle button more accessible:**

```typescript
// Add this inside the button's onClick handler
const toggleToolbarVisibility = useCallback(() => {
  setToolbarVisible(!isToolbarVisible);
  
  // Announce to screen readers
  const announcement = !isToolbarVisible 
    ? t('toolbarVisibilityAnnounceShow') 
    : t('toolbarVisibilityAnnounceHide');
  
  // Use an aria-live region or a toast notification
  toast.success(announcement, {
    duration: 2000,
    id: 'toolbar-visibility'
  });
}, [isToolbarVisible, setToolbarVisible, t]);
```

This implementation:

1. Conditionally renders the toolbar based on the `isToolbarVisible` setting
2. Provides a toggle button to show the toolbar when it's hidden
3. Initializes the application with the default tool on component mount
4. Adds translation keys for accessibility
5. Includes suggestions for keyboard shortcuts and accessibility improvements

The toolbar will be hidden or shown based on the user's preference stored in the configuration, and the default tool will be automatically selected when the application loads. 