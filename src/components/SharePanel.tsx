import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { 
  RadioGroup, 
  RadioGroupItem 
} from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Copy, RefreshCw } from 'lucide-react';
import { useTranslate, availableLanguages, languageNames } from '@/utils/translate';
import { useShareViewOptions } from '@/contexts/ShareViewOptionsContext';
import { toast } from 'sonner';

interface SharePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SharePanel: React.FC<SharePanelProps> = ({ open, onOpenChange }) => {
  const t = useTranslate();
  const { 
    shareViewOptions, 
    updateShareViewOption, 
    resetToDefaults, 
    generateShareUrl, 
    generateEmbedCode 
  } = useShareViewOptions();

  const [embedWidth, setEmbedWidth] = useState('800');
  const [embedHeight, setEmbedHeight] = useState('600');

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

  const handleReset = () => {
    resetToDefaults();
    setEmbedWidth('800');
    setEmbedHeight('600');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // When closing the panel, reset to defaults
      resetToDefaults();
      setEmbedWidth('800');
      setEmbedHeight('600');
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4">
          <DialogTitle>{t('sharePanel.title')}</DialogTitle>
          <DialogDescription>
            {t('sharePanel.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
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
                  <Label htmlFor="funcOnly" className="text-sm font-medium">
                    {t('sharePanel.options.funcOnly')}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {t('sharePanel.options.funcOnlyDescription')}
                  </p>
                </div>
                <Switch
                  id="funcOnly"
                  checked={shareViewOptions.funcOnly}
                  onCheckedChange={(checked) => updateShareViewOption('funcOnly', checked)}
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
                  disabled={shareViewOptions.layout === 'noninteractive' || shareViewOptions.funcOnly}
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
            </div>
          </div>

          <Separator />

          {/* Language Selection */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium">{t('sharePanel.language.title')}</h3>
              <p className="text-xs text-muted-foreground">
                {t('sharePanel.language.description')}
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
            <Button onClick={handleReset} size="sm" variant="ghost" className="w-full">
              <RefreshCw className="h-4 w-4 mr-1" />
              {t('sharePanel.url.resetButton')}
            </Button>
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
        </div>
      </DialogContent>
    </Dialog>
  );
};