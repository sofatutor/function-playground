import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslate } from '@/utils/translate';
import { Maximize2, Minimize2 } from 'lucide-react';

interface GeometryControlsProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const GeometryControls: React.FC<GeometryControlsProps> = ({
  isFullscreen,
  onToggleFullscreen
}) => {
  const t = useTranslate();

  return (
    <div className="flex items-center space-x-1">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={onToggleFullscreen}
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
    </div>
  );
};

export default GeometryControls; 