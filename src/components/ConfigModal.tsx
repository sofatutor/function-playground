import React, { useState, useEffect } from 'react';
import { useGlobalConfig } from '@/context/ConfigContext';
import { useTranslate } from '@/utils/translate';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Trash2, Terminal } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

const ConfigModal: React.FC = () => {
  const { 
    isGlobalConfigModalOpen, 
    setGlobalConfigModalOpen,
    language,
    setLanguage,
    openaiApiKey,
    setOpenaiApiKey,
    loggingEnabled,
    setLoggingEnabled
  } = useGlobalConfig();
  
  const [apiKeyInput, setApiKeyInput] = useState(openaiApiKey || '');
  const t = useTranslate();
  
  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Update input when openaiApiKey changes (e.g., on initial load)
  useEffect(() => {
    setApiKeyInput(openaiApiKey || '');
  }, [openaiApiKey]);
  
  // Auto-save API key when it changes
  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (apiKeyInput !== openaiApiKey) {
        console.log('Saving API key:', apiKeyInput ? '(key provided)' : '(empty)');
        await setOpenaiApiKey(apiKeyInput.trim() || null);
      }
    }, 500); // Debounce for 500ms
    
    return () => clearTimeout(timeoutId);
  }, [apiKeyInput, openaiApiKey, setOpenaiApiKey]);
  
  const handleClearApiKey = async () => {
    setApiKeyInput('');
    await setOpenaiApiKey(null);
  };
  
  const handleLanguageChange = (value: string) => {
    setLanguage(value);
  };
  
  return (
    <Dialog open={isGlobalConfigModalOpen} onOpenChange={setGlobalConfigModalOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="pb-2">
          <DialogTitle>{t('configModal.title')}</DialogTitle>
          <DialogDescription>
            {t('configModal.description')}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="mt-2">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: isDevelopment ? '1fr 1fr 1fr' : '1fr 1fr' }}>
            <TabsTrigger value="general">{t('configModal.tabs.general')}</TabsTrigger>
            <TabsTrigger value="openai">{t('configModal.tabs.openai')}</TabsTrigger>
            {isDevelopment && (
              <TabsTrigger value="developer">{t('configModal.tabs.developer')}</TabsTrigger>
            )}
          </TabsList>
          
          {/* General Tab */}
          <TabsContent value="general" className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {t('configModal.general.description')}
            </p>
            
            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>{t('configModal.general.languageLabel')}</span>
              </Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger id="language">
                  <SelectValue placeholder={t('configModal.general.languagePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="de">Deutsch</SelectItem>
                  <SelectItem value="es">Español</SelectItem>
                  <SelectItem value="fr">Français</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
          
          {/* OpenAI API Tab */}
          <TabsContent value="openai" className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {t('configModal.openai.description')}
            </p>
            
            <div className="space-y-2">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="api-key" className="mb-1 block">
                    {t('configModal.openai.apiKeyLabel')}
                  </Label>
                  <Input
                    id="api-key"
                    type="password"
                    placeholder={t('configModal.openai.apiKeyPlaceholder')}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                  />
                </div>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleClearApiKey}
                  title={t('configModal.openai.clearApiKey')}
                  disabled={!apiKeyInput.trim()}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('configModal.openai.apiKeyHint')}
              </p>
            </div>
          </TabsContent>
          
          {/* Developer Tab - Only shown in development mode */}
          {isDevelopment && (
            <TabsContent value="developer" className="space-y-3 py-2">
              <p className="text-sm text-muted-foreground">
                {t('configModal.developer.description')}
              </p>
              
              <div className="space-y-4">
                {/* Logging Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="logging-toggle" className="flex items-center gap-2">
                      <Terminal className="h-4 w-4" />
                      <span>{t('configModal.developer.loggingLabel')}</span>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('configModal.developer.loggingDescription')}
                    </p>
                  </div>
                  <Switch
                    id="logging-toggle"
                    checked={loggingEnabled}
                    onCheckedChange={setLoggingEnabled}
                  />
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigModal; 