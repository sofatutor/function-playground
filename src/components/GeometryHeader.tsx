
import React from 'react';
import LanguageSelector from './LanguageSelector';
import { useTranslate } from '@/utils/translate';

const GeometryHeader: React.FC = () => {
  const t = useTranslate();
  
  return (
    <div className="flex flex-col space-y-1 mb-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">{t('appTitle')}</h1>
        <LanguageSelector />
      </div>
      <p className="text-sm text-muted-foreground">
        {t('appDescription')}
      </p>
    </div>
  );
};

export default GeometryHeader;
