import React, { useState } from 'react';
import { useTranslate } from '@/utils/translate';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Maximize2, Minimize2, Share2, Settings } from 'lucide-react';
import { useShapeOperations } from '@/hooks/useShapeOperations';
import { useGlobalConfig } from '@/context/ConfigContext';

interface GeometryHeaderProps {
  isFullscreen: boolean;
  onToggleFullscreen?: () => void;
}

const GeometryHeader: React.FC<GeometryHeaderProps> = ({ isFullscreen, onToggleFullscreen }) => {
  const t = useTranslate();
  const [isFullscreenState, setIsFullscreenState] = useState(isFullscreen);
  const { shareCanvasUrl, shapes } = useShapeOperations();
  const { setGlobalConfigModalOpen } = useGlobalConfig();

  const toggleFullscreen = () => {
    if (onToggleFullscreen) {
      onToggleFullscreen();
      return;
    }

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreenState(true);
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreenState(false);
        }).catch(err => {
          console.error(`Error attempting to exit fullscreen: ${err.message}`);
        });
      }
    }
  };

  // Listen for fullscreen change events (e.g., when user presses Esc)
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreenState(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <header className="flex items-center justify-between p-0.5 sm:p-1 md:p-2 lg:p-4 bg-background border-b">
      <div className="flex items-center space-x-1 sm:space-x-2 ml-1 sm:ml-0">
        <h1 className="text-base sm:text-lg md:text-xl font-bold">{t('appTitle')}</h1>
        <p className="hidden md:block text-xs sm:text-sm text-muted-foreground">{t('appDescription')}</p>
      </div>
      
      <div className="flex items-center space-x-1 sm:space-x-2 mr-1 sm:mr-0">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={() => setGlobalConfigModalOpen(true)}
              >
                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('configModal.openButton')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={shareCanvasUrl}
                disabled={shapes.length === 0}
              >
                <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('shareCanvas')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-7 w-7 sm:h-8 sm:w-8"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <Maximize2 className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isFullscreen ? t('exitFullscreen') : t('enterFullscreen')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </header>
  );
};

export default GeometryHeader;
