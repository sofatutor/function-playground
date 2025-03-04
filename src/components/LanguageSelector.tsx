import React from 'react';
import { useConfig } from '@/context/ConfigContext';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { availableLanguages, languageNames } from '@/utils/translate';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useConfig();

  // Get the display name for the current language
  const getLanguageDisplayCode = (code: string): string => {
    switch (code) {
      case 'en': return 'EN';
      case 'de': return 'DE';
      case 'es': return 'ES';
      case 'fr': return 'FR';
      default: return code.toUpperCase();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Globe size={16} />
          <span>{getLanguageDisplayCode(language)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableLanguages.map((langCode) => (
          <DropdownMenuItem 
            key={langCode} 
            onClick={() => setLanguage(langCode)}
            className={language === langCode ? "bg-accent" : ""}
          >
            {languageNames[langCode as keyof typeof languageNames]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
