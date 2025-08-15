import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslate } from '@/utils/translate';
import { Maximize2, Minimize2, Share2, Settings } from 'lucide-react';
import { useGlobalConfig } from '@/context/ConfigContext';
import { SharePanel } from '@/components/SharePanel';

interface GlobalControlsProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const GlobalControls: React.FC<GlobalControlsProps> = ({
  isFullscreen,
  onToggleFullscreen
}) => {
  const t = useTranslate();
  const { setGlobalConfigModalOpen } = useGlobalConfig();
  const [isSharePanelOpen, setIsSharePanelOpen] = useState(false);

  return (
    <>
      <div className="flex items-center space-x-1">
        <TooltipProvider>
          {/* Share Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsSharePanelOpen(true)}
                className="h-9 w-9"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('shareCanvas')}</p>
            </TooltipContent>
          </Tooltip>

          {/* Global Settings Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setGlobalConfigModalOpen(true)}
                className="h-9 w-9"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('configModal.title')}</p>
            </TooltipContent>
          </Tooltip>

          {/* Fullscreen Button */}
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
      
      <SharePanel 
        open={isSharePanelOpen} 
        onOpenChange={setIsSharePanelOpen} 
      />
    </>
  );
};

export default GlobalControls; 