import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslate } from '@/utils/translate';
import { Maximize2, Minimize2, Settings } from 'lucide-react';
import UnifiedSettingsModal from '@/components/UnifiedSettingsModal';

interface GlobalControlsProps {
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  showFullscreenButton?: boolean;
  showZoomControls?: boolean;
  showAdminControls?: boolean;
}

const GlobalControls: React.FC<GlobalControlsProps> = ({
  isFullscreen,
  onToggleFullscreen,
  showFullscreenButton = true,
  showZoomControls: _showZoomControls = true,
  showAdminControls = true
}) => {
  const t = useTranslate();
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  return (
    <>
      <div className="flex items-center space-x-1">
        <TooltipProvider>
          {/* Unified Settings Button - only show if admin controls are enabled */}
          {showAdminControls && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setIsSettingsModalOpen(true)}
                  className="h-9 w-9"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{t('settingsTooltip')}</p>
              </TooltipContent>
            </Tooltip>
          )}

          {/* Fullscreen Button - only show if enabled */}
          {showFullscreenButton && (
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
          )}
        </TooltipProvider>
      </div>
      
      {/* Unified Settings Modal - always render to prevent unmounting when admin controls are toggled */}
      <UnifiedSettingsModal 
        open={isSettingsModalOpen} 
        onOpenChange={setIsSettingsModalOpen} 
      />
    </>
  );
};

export default GlobalControls; 