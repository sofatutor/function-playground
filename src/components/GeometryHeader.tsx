
import React, { useState } from 'react';
import LanguageSelector from './LanguageSelector';
import { useTranslate } from '@/utils/translate';
import { Button } from './ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';

const GeometryHeader: React.FC = () => {
  const t = useTranslate();
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => {
          setIsFullscreen(false);
        }).catch(err => {
          console.error(`Error attempting to exit fullscreen: ${err.message}`);
        });
      }
    }
  };

  // Listen for fullscreen change events (e.g., when user presses Esc)
  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);
  
  return (
    <div className="flex flex-col space-y-1 mb-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{t('appTitle')}</h1>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={toggleFullscreen}
            title={isFullscreen ? t('exitFullscreen') : t('enterFullscreen')}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </Button>
          <LanguageSelector />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        {t('appDescription')}
      </p>
    </div>
  );
};

export default GeometryHeader;
