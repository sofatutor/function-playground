import React, { useState } from 'react';
import { useTranslate } from '@/utils/translate';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Maximize2, Minimize2, Share2, Settings } from 'lucide-react';
import { useShapeOperations } from '@/hooks/useShapeOperations';
import { useGlobalConfig } from '@/context/ConfigContext';

interface GeometryHeaderProps {
  isFullscreen: boolean;
}

const GeometryHeader: React.FC<GeometryHeaderProps> = ({ isFullscreen }) => {
  const t = useTranslate();
  const [isFullscreenState, setIsFullscreenState] = useState(isFullscreen);
  const { shareCanvasUrl, shapes } = useShapeOperations();
  const { setGlobalConfigModalOpen } = useGlobalConfig();

  const toggleFullscreen = () => {
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
    <header className="flex items-center justify-between p-4 bg-background border-b">
      <div className="flex items-center space-x-2">
        <h1 className="text-xl font-bold">{t('appTitle')}</h1>
        <p className="hidden md:block text-sm text-muted-foreground">{t('appDescription')}</p>
      </div>
      
      <div className="flex items-center space-x-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => setGlobalConfigModalOpen(true)}
              >
                <Settings className="h-4 w-4" />
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
                onClick={shareCanvasUrl}
                disabled={shapes.length === 0}
              >
                <Share2 className="h-4 w-4" />
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
                onClick={toggleFullscreen}
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
    </header>
  );
};

export default GeometryHeader;
