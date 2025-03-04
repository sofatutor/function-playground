import React, { useState } from 'react';
import LanguageSelector from './LanguageSelector';
import { useTranslate } from '@/utils/translate';
import { Button } from './ui/button';
import { Maximize2, Minimize2, Share2 } from 'lucide-react';
import { useShapeOperations } from '@/hooks/useShapeOperations';

interface GeometryHeaderProps {
  isFullscreen: boolean;
}

const GeometryHeader: React.FC<GeometryHeaderProps> = ({ isFullscreen }) => {
  const t = useTranslate();
  const [isFullscreenState, setIsFullscreenState] = useState(isFullscreen);
  const { shareCanvasUrl, shapes } = useShapeOperations();

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
    <div className={`flex flex-col ${isFullscreenState ? 'space-y-0 mb-1' : 'space-y-1 mb-6'} animate-fade-in`}>
      <div className="flex justify-between items-center">
        <h1 className={`${isFullscreenState ? 'text-xl' : 'text-3xl'} font-bold tracking-tight transition-all`}>
          {t('appTitle')}
        </h1>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={shareCanvasUrl}
            title={t('shareCanvas')}
            disabled={shapes.length === 0}
          >
            <Share2 size={18} />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleFullscreen}
            title={isFullscreenState ? t('exitFullscreen') : t('enterFullscreen')}
          >
            {isFullscreenState ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </Button>
          <LanguageSelector />
        </div>
      </div>
      {!isFullscreenState && (
        <p className="text-sm text-muted-foreground">
          {t('appDescription')}
        </p>
      )}
    </div>
  );
};

export default GeometryHeader;
