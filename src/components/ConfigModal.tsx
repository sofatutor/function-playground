import React, { useState } from 'react';
import { useConfig } from '@/context/ConfigContext';
import { useTranslate } from '@/utils/translate';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MeasurementUnit } from '@/types/shapes';
import { Eye, EyeOff } from 'lucide-react';
import CalibrationTool from './CalibrationTool';

const ConfigModal: React.FC = () => {
  const t = useTranslate();
  const { 
    isConfigModalOpen, 
    setConfigModalOpen, 
    openaiApiKey, 
    setOpenaiApiKey,
    pixelsPerUnit,
    setPixelsPerUnit,
    measurementUnit,
    setMeasurementUnit
  } = useConfig();

  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(openaiApiKey || '');
  const [activeTab, setActiveTab] = useState('general');

  const handleSaveApiKey = () => {
    setOpenaiApiKey(apiKeyInput.trim() || null);
  };

  const handleClearApiKey = () => {
    setApiKeyInput('');
    setOpenaiApiKey(null);
  };

  const handleCalibrationComplete = (newPixelsPerUnit: number) => {
    setPixelsPerUnit(newPixelsPerUnit);
  };

  const handleUnitChange = (value: string) => {
    setMeasurementUnit(value as MeasurementUnit);
  };

  return (
    <Dialog open={isConfigModalOpen} onOpenChange={setConfigModalOpen}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{t('configModal.title')}</DialogTitle>
          <DialogDescription>
            {t('configModal.description')}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="general">{t('configModal.tabs.general')}</TabsTrigger>
            <TabsTrigger value="openai">{t('configModal.tabs.openai')}</TabsTrigger>
            <TabsTrigger value="calibration">{t('configModal.tabs.calibration')}</TabsTrigger>
          </TabsList>
          
          {/* General Settings Tab */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>{t('configModal.general.title')}</CardTitle>
                <CardDescription>{t('configModal.general.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="measurement-unit">{t('units.label')}</Label>
                  <Select value={measurementUnit} onValueChange={handleUnitChange}>
                    <SelectTrigger id="measurement-unit">
                      <SelectValue placeholder={t('units.placeholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cm">{t('units.centimeters')}</SelectItem>
                      <SelectItem value="in">{t('units.inches')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* OpenAI API Settings Tab */}
          <TabsContent value="openai">
            <Card>
              <CardHeader>
                <CardTitle>{t('configModal.openai.title')}</CardTitle>
                <CardDescription>{t('configModal.openai.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="api-key">{t('configModal.openai.apiKeyLabel')}</Label>
                  <div className="flex">
                    <Input
                      id="api-key"
                      type={showApiKey ? "text" : "password"}
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder={t('configModal.openai.apiKeyPlaceholder')}
                      className="flex-1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="ml-2"
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('configModal.openai.apiKeyHint')}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleClearApiKey}>
                  {t('configModal.openai.clearApiKey')}
                </Button>
                <Button onClick={handleSaveApiKey}>
                  {t('configModal.openai.saveApiKey')}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          {/* Calibration Tab */}
          <TabsContent value="calibration" className="relative z-[100]">
            <CalibrationTool
              measurementUnit={measurementUnit}
              onCalibrationComplete={handleCalibrationComplete}
              defaultPixelsPerUnit={pixelsPerUnit}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigModal; 