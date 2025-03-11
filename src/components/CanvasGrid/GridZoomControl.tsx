import React from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { useGridZoom } from '@/contexts/GridZoomContext';
import { useTranslate } from '@/hooks/useTranslate';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const GridZoomControl: React.FC = () => {
  const t = useTranslate();
  const { zoomFactor, setZoomFactor } = useGridZoom();

  const handleZoomIn = () => {
    const newZoom = Math.min(3, zoomFactor + 0.05);
    setZoomFactor(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.3, zoomFactor - 0.05);
    setZoomFactor(newZoom);
  };

  // Handle reset
  const handleReset = () => {
    setZoomFactor(1);
  };

  return (
    <div 
      className="absolute bottom-4 left-4 flex items-center space-x-1 bg-background/80 backdrop-blur-sm p-1 rounded-lg border shadow-sm" 
      style={{ 
        zIndex: 50,
        pointerEvents: 'auto'
      }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              className="h-8 w-8"
            >
              <ZoomOut size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Zoom Out (Ctrl -)</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs min-w-[4rem]"
              onClick={handleReset}
            >
              {Math.round(zoomFactor * 100)}%
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to Reset Zoom to 100%</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              className="h-8 w-8"
            >
              <ZoomIn size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Zoom In (Ctrl +)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default GridZoomControl; 