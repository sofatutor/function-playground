import React from 'react';
import { useTranslate } from '@/utils/translate';
import { useIsMobile } from '@/hooks/use-mobile';

interface GeometryHeaderProps {
  isFullscreen: boolean;
  className?: string;
}

const GeometryHeader: React.FC<GeometryHeaderProps> = ({ isFullscreen, className = '' }) => {
  const t = useTranslate();
  const isMobile = useIsMobile();

  // If on mobile, don't render the header
  if (isMobile) {
    return null;
  }

  // Don't render in fullscreen mode
  if (isFullscreen) {
    return null;
  }

  return (
    <header className={`flex items-center justify-between p-0.5 sm:p-1 md:p-2 lg:p-4 ${className}`}>
      <div className="flex items-center space-x-1 sm:space-x-2 ml-1 sm:ml-0">
        <h1 className="text-base sm:text-lg md:text-xl font-bold">{t('appTitle')}</h1>
        <p className="hidden md:block text-xs sm:text-sm text-muted-foreground">{t('appDescription')}</p>
      </div>
    </header>
  );
};

export default GeometryHeader;
