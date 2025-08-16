import React, { useState, useEffect } from 'react';
import { useGlobalConfig } from '@/context/ConfigContext';
import { useShareViewOptions } from '@/contexts/ShareViewOptionsContext';
import { useTranslate, availableLanguages, languageNames } from '@/utils/translate';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Globe, Trash2, Terminal, Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface UnifiedSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UnifiedSettingsModal: React.FC<UnifiedSettingsModalProps> = ({ open, onOpenChange }) => {
  const { 
    language,
    setLanguage,
    openaiApiKey,
    setOpenaiApiKey,
    loggingEnabled,
    setLoggingEnabled
  } = useGlobalConfig();
  
  const { 
    shareViewOptions, 
    updateShareViewOption, 
    applyPendingChanges,
    generateShareUrl, 
    generateEmbedCode,
    setIsSharePanelOpen
  } = useShareViewOptions();
  
  const [apiKeyInput, setApiKeyInput] = useState(openaiApiKey || '');
  const [embedWidth, setEmbedWidth] = useState('800');
  const [embedHeight, setEmbedHeight] = useState('600');
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

  const shareUrl = generateShareUrl();
  const embedCode = generateEmbedCode(parseInt(embedWidth) || 800, parseInt(embedHeight) || 600);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success(t('sharePanel.url.copiedSuccess'));
    } catch {
      toast.error(t('sharePanel.url.copyError'));
    }
  };

  const handleCopyEmbedCode = async () => {
    try {
      await navigator.clipboard.writeText(embedCode);
      toast.success(t('sharePanel.embed.copiedSuccess'));
    } catch {
      toast.error(t('sharePanel.embed.copyError'));
    }
  };

  const handleResetViewOptions = () => {
    // Reset all view-related ShareViewOptions to defaults but preserve the admin and lang settings
    updateShareViewOption('layout', 'default');
    updateShareViewOption('funcControls', true);
    updateShareViewOption('fullscreen', false);
    updateShareViewOption('tools', true);
    updateShareViewOption('zoom', true);
    updateShareViewOption('unitCtl', true);
    updateShareViewOption('header', true);
  };

  const handleOpenChange = (newOpen: boolean) => {
    // Update SharePanel state
    setIsSharePanelOpen(newOpen);
    
    if (!newOpen) {
      // When closing the modal, apply any pending admin/layout changes
      applyPendingChanges();
      // Only reset Share tab specific options (embed dimensions), not View tab options
      setEmbedWidth('800');
      setEmbedHeight('600');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={() => setIsSharePanelOpen(true)}
      >
        <DialogHeader className="pb-4">
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Manage application settings, view options, and sharing preferences
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="view">View</TabsTrigger>
            <TabsTrigger value="share">Share</TabsTrigger>
          </TabsList>
          
          {/* General Tab */}
          <TabsContent value="general" className="space-y-6 py-4">
            {/* Language Selection */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">Language</h3>
                <p className="text-xs text-muted-foreground">
                  Choose your preferred language for the interface
                </p>
              </div>
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
            </div>

            <Separator />

            {/* OpenAI API Settings */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">OpenAI API</h3>
                <p className="text-xs text-muted-foreground">
                  {t('configModal.openai.description')}
                </p>
              </div>
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
            </div>

            {/* Developer Settings - Only shown in development mode */}
            {isDevelopment && (
              <>
                <Separator />
                <div className="space-y-3">
                  <div>
                    <h3 className="text-sm font-medium">Developer Settings</h3>
                    <p className="text-xs text-muted-foreground">
                      {t('configModal.developer.description')}
                    </p>
                  </div>
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
              </>
            )}
          </TabsContent>
          
          {/* View Tab */}
          <TabsContent value="view" className="space-y-6 py-4">
            {/* Layout Selection */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">{t('sharePanel.layout.title')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('sharePanel.layout.description')}
                </p>
              </div>
              <RadioGroup
                value={shareViewOptions.layout}
                onValueChange={(value) => updateShareViewOption('layout', value as 'default' | 'noninteractive')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="default" id="layout-default" />
                  <Label htmlFor="layout-default" className="flex-1 cursor-pointer">
                    <div>
                      <div className="font-medium">{t('sharePanel.layout.default')}</div>
                      <div className="text-xs text-muted-foreground">
                        {t('sharePanel.layout.defaultDescription')}
                      </div>
                    </div>
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="noninteractive" id="layout-noninteractive" />
                  <Label htmlFor="layout-noninteractive" className="flex-1 cursor-pointer">
                    <div>
                      <div className="font-medium">{t('sharePanel.layout.noninteractive')}</div>
                      <div className="text-xs text-muted-foreground">
                        {t('sharePanel.layout.noninteractiveDescription')}
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Separator />

            {/* UI Options */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">{t('sharePanel.options.title')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('sharePanel.options.description')}
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="funcControls" className="text-sm font-medium">
                      {t('sharePanel.options.funcControls')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('sharePanel.options.funcControlsDescription')}
                    </p>
                  </div>
                  <Switch
                    id="funcControls"
                    checked={shareViewOptions.funcControls}
                    onCheckedChange={(checked) => updateShareViewOption('funcControls', checked)}
                    disabled={shareViewOptions.layout === 'noninteractive'}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="tools" className="text-sm font-medium">
                      {t('sharePanel.options.tools')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('sharePanel.options.toolsDescription')}
                    </p>
                  </div>
                  <Switch
                    id="tools"
                    checked={shareViewOptions.tools}
                    onCheckedChange={(checked) => updateShareViewOption('tools', checked)}
                    disabled={shareViewOptions.layout === 'noninteractive'}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="header" className="text-sm font-medium">
                      {t('sharePanel.options.header')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('sharePanel.options.headerDescription')}
                    </p>
                  </div>
                  <Switch
                    id="header"
                    checked={shareViewOptions.header}
                    onCheckedChange={(checked) => updateShareViewOption('header', checked)}
                    disabled={shareViewOptions.layout === 'noninteractive'}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="zoom" className="text-sm font-medium">
                      {t('sharePanel.options.zoom')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('sharePanel.options.zoomDescription')}
                    </p>
                  </div>
                  <Switch
                    id="zoom"
                    checked={shareViewOptions.zoom}
                    onCheckedChange={(checked) => updateShareViewOption('zoom', checked)}
                    disabled={shareViewOptions.layout === 'noninteractive'}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="unitCtl" className="text-sm font-medium">
                      {t('sharePanel.options.unitCtl')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('sharePanel.options.unitCtlDescription')}
                    </p>
                  </div>
                  <Switch
                    id="unitCtl"
                    checked={shareViewOptions.unitCtl}
                    onCheckedChange={(checked) => updateShareViewOption('unitCtl', checked)}
                    disabled={shareViewOptions.layout === 'noninteractive'}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="fullscreen" className="text-sm font-medium">
                      {t('sharePanel.options.fullscreen')}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {t('sharePanel.options.fullscreenDescription')}
                    </p>
                  </div>
                  <Switch
                    id="fullscreen"
                    checked={shareViewOptions.fullscreen}
                    onCheckedChange={(checked) => updateShareViewOption('fullscreen', checked)}
                    disabled={shareViewOptions.layout === 'noninteractive'}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Reset to Defaults */}
            <div className="space-y-3">
              <Button onClick={handleResetViewOptions} size="sm" variant="ghost" className="w-full">
                <RefreshCw className="h-4 w-4 mr-1" />
                Reset View Options to Defaults
              </Button>
            </div>
          </TabsContent>

          {/* Share Tab */}
          <TabsContent value="share" className="space-y-6 py-4">
            {/* Admin Controls Toggle */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">{t('sharePanel.options.admin')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('sharePanel.options.adminDescription')}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="admin-share" className="text-sm font-medium">
                    Show admin controls in shared view
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    When enabled, share and settings buttons will be visible in the shared URL
                  </p>
                </div>
                <Switch
                  id="admin-share"
                  checked={shareViewOptions.admin}
                  onCheckedChange={(checked) => updateShareViewOption('admin', checked)}
                  disabled={shareViewOptions.layout === 'noninteractive'}
                />
              </div>
            </div>

            <Separator />

            {/* Language Selection for Shared View */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">{t('sharePanel.language.title')}</h3>
                <p className="text-xs text-muted-foreground">
                  Select the language for the shared view (only affects shared URLs, not current session)
                </p>
              </div>
              <Select
                value={shareViewOptions.lang}
                onValueChange={(value) => updateShareViewOption('lang', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('sharePanel.language.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {languageNames[lang as keyof typeof languageNames]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Share URL */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">{t('sharePanel.url.title')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('sharePanel.url.description')}
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="flex-1 text-xs"
                />
                <Button onClick={handleCopyUrl} size="sm" variant="outline">
                  <Copy className="h-4 w-4 mr-1" />
                  {t('sharePanel.url.copyButton')}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Embed Code */}
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium">{t('sharePanel.embed.title')}</h3>
                <p className="text-xs text-muted-foreground">
                  {t('sharePanel.embed.description')}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="embed-width" className="text-xs">
                    {t('sharePanel.embed.widthLabel')}
                  </Label>
                  <Input
                    id="embed-width"
                    type="number"
                    value={embedWidth}
                    onChange={(e) => setEmbedWidth(e.target.value)}
                    placeholder={t('sharePanel.embed.widthPlaceholder')}
                    min="100"
                    max="2000"
                  />
                </div>
                <div>
                  <Label htmlFor="embed-height" className="text-xs">
                    {t('sharePanel.embed.heightLabel')}
                  </Label>
                  <Input
                    id="embed-height"
                    type="number"
                    value={embedHeight}
                    onChange={(e) => setEmbedHeight(e.target.value)}
                    placeholder={t('sharePanel.embed.heightPlaceholder')}
                    min="100"
                    max="2000"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="embed-code" className="text-xs">
                  {t('sharePanel.embed.codeLabel')}
                </Label>
                <Textarea
                  id="embed-code"
                  value={embedCode}
                  readOnly
                  className="text-xs font-mono"
                  rows={3}
                />
              </div>
              <Button onClick={handleCopyEmbedCode} size="sm" variant="outline" className="w-full">
                <Copy className="h-4 w-4 mr-1" />
                {t('sharePanel.embed.copyButton')}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default UnifiedSettingsModal;