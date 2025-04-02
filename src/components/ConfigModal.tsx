import React, { useState, useEffect } from 'react';
import { useGlobalConfig } from '@/context/ConfigContext';
import { useTranslate } from '@/utils/translate';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, Trash2, Terminal, Eye, Share2, Copy } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { updateUrlWithData } from '@/utils/urlEncoding';

const ConfigModal: React.FC = () => {
  const { 
    isGlobalConfigModalOpen, 
    setGlobalConfigModalOpen,
    language,
    setLanguage,
    openaiApiKey,
    setOpenaiApiKey,
    loggingEnabled,
    setLoggingEnabled,
    isToolbarVisible,
    setToolbarVisible,
    defaultTool,
    setDefaultTool
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
  
  // Function to generate and copy sharing URL with the default tool
  const handleShareWithDefaultTool = () => {
    // Create a URL object based on the current URL
    const url = new URL(window.location.origin + window.location.pathname);
    
    // Only add the selected default tool parameter
    if (defaultTool) {
      url.searchParams.set('tool', defaultTool);
    }
    
    // Copy the URL to clipboard
    navigator.clipboard.writeText(url.toString())
      .then(() => {
        toast.success(t('configModal.sharing.urlCopiedSuccess'));
      })
      .catch(() => {
        toast.error(t('configModal.sharing.urlCopiedError'));
      });
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
          <TabsList className="grid w-full" style={{ 
            gridTemplateColumns: isDevelopment 
              ? '1fr 1fr 1fr 1fr 1fr' 
              : '1fr 1fr 1fr 1fr' 
          }}>
            <TabsTrigger value="general">{t('configModal.tabs.general')}</TabsTrigger>
            <TabsTrigger value="display">{t('configModal.tabs.display')}</TabsTrigger>
            <TabsTrigger value="openai">{t('configModal.tabs.openai')}</TabsTrigger>
            <TabsTrigger value="sharing">{t('configModal.tabs.sharing')}</TabsTrigger>
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
          
          {/* Display Tab */}
          <TabsContent value="display" className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {t('configModal.display.description')}
            </p>
            
            <div className="space-y-4">
              {/* Toolbar Visibility Toggle */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="toolbar-toggle" className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>{t('configModal.display.toolbarVisibilityLabel')}</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('configModal.display.toolbarVisibilityDescription')}
                  </p>
                </div>
                <Switch
                  id="toolbar-toggle"
                  checked={isToolbarVisible}
                  onCheckedChange={setToolbarVisible}
                />
              </div>
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
          
          {/* Sharing Tab */}
          <TabsContent value="sharing" className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {t('configModal.sharing.description')}
            </p>
            
            <div className="space-y-4">
              {/* Default Tool Dropdown - Only used for generating sharing URLs */}
              <div className="space-y-2">
                <Label htmlFor="default-tool" className="flex items-center gap-2">
                  <Share2 className="h-4 w-4" />
                  <span>{t('configModal.sharing.defaultToolLabel')}</span>
                </Label>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Select value={defaultTool} onValueChange={setDefaultTool}>
                      <SelectTrigger id="default-tool">
                        <SelectValue placeholder={t('configModal.sharing.defaultToolPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="select">{t('configModal.sharing.tools.select')}</SelectItem>
                        <SelectItem value="rectangle">{t('configModal.sharing.tools.rectangle')}</SelectItem>
                        <SelectItem value="circle">{t('configModal.sharing.tools.circle')}</SelectItem>
                        <SelectItem value="triangle">{t('configModal.sharing.tools.triangle')}</SelectItem>
                        <SelectItem value="line">{t('configModal.sharing.tools.line')}</SelectItem>
                        <SelectItem value="function">{t('configModal.sharing.tools.function')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('configModal.sharing.defaultToolDescription')}
                </p>
              </div>
              
              <div className="pt-2">
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={handleShareWithDefaultTool}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('configModal.sharing.generateAndCopyUrl')}
                </Button>
                <p className="text-xs text-muted-foreground pt-1">
                  {t('configModal.sharing.sharingNote')}
                </p>
              </div>
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