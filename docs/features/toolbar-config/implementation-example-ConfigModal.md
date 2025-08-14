# Implementation Example: ConfigModal Updates

This document shows the implementation example for updating the `ConfigModal.tsx` component to include UI controls for toolbar visibility and default tool selection.

## Adding a New "Display" Tab

```typescript
// src/components/ConfigModal.tsx

import { /* existing imports */ } from '...';
import { Switch } from '@/components/ui/switch';
import { Monitor, Eye } from 'lucide-react'; // New imports for icons

const ConfigModal: React.FC = () => {
  const { 
    // Existing context values
    isGlobalConfigModalOpen, 
    setGlobalConfigModalOpen,
    language,
    setLanguage,
    openaiApiKey,
    setOpenaiApiKey,
    loggingEnabled,
    setLoggingEnabled,
    
    // New context values
    isToolbarVisible,
    setToolbarVisible,
    defaultTool,
    setDefaultTool
  } = useGlobalConfig();
  
  // Existing state and functions...
  
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
              ? '1fr 1fr 1fr 1fr' 
              : '1fr 1fr 1fr' 
          }}>
            <TabsTrigger value="general">{t('configModal.tabs.general')}</TabsTrigger>
            <TabsTrigger value="display">{t('configModal.tabs.display')}</TabsTrigger>
            <TabsTrigger value="openai">{t('configModal.tabs.openai')}</TabsTrigger>
            {isDevelopment && (
              <TabsTrigger value="developer">{t('configModal.tabs.developer')}</TabsTrigger>
            )}
          </TabsList>
          
          {/* Existing General Tab */}
          <TabsContent value="general" className="space-y-3 py-2">
            {/* ... existing content ... */}
          </TabsContent>
          
          {/* New Display Tab */}
          <TabsContent value="display" className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              {t('configModal.display.description')}
            </p>
            
            {/* Toolbar Visibility Toggle */}
            <div className="space-y-4">
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
              
              {/* Default Tool Selection */}
              <div className="space-y-2">
                <Label htmlFor="default-tool" className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span>{t('configModal.display.defaultToolLabel')}</span>
                </Label>
                <Select value={defaultTool} onValueChange={setDefaultTool}>
                  <SelectTrigger id="default-tool">
                    <SelectValue placeholder={t('configModal.display.defaultToolPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="select">{t('toolNames.select')}</SelectItem>
                    <SelectItem value="rectangle">{t('shapeNames.rectangle')}</SelectItem>
                    <SelectItem value="circle">{t('shapeNames.circle')}</SelectItem>
                    <SelectItem value="triangle">{t('shapeNames.triangle')}</SelectItem>
                    <SelectItem value="line">{t('shapeNames.line')}</SelectItem>
                    <SelectItem value="function">{t('toolNames.function')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t('configModal.display.defaultToolDescription')}
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* Existing OpenAI API Tab */}
          <TabsContent value="openai" className="space-y-3 py-2">
            {/* ... existing content ... */}
          </TabsContent>
          
          {/* Existing Developer Tab */}
          {isDevelopment && (
            <TabsContent value="developer" className="space-y-3 py-2">
              {/* ... existing content ... */}
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ConfigModal;
```

## Required Translation Updates

Add the following translation keys to all language files:

```typescript
// en.json (English example)
{
  "configModal": {
    // Existing translations...
    "tabs": {
      "general": "General",
      "display": "Display", // New tab
      "openai": "OpenAI API",
      "developer": "Developer"
    },
    "display": {
      "description": "Configure how the application looks and behaves.",
      "toolbarVisibilityLabel": "Show Toolbar",
      "toolbarVisibilityDescription": "Toggle the visibility of the toolbar. When hidden, you can still use keyboard shortcuts.",
      "defaultToolLabel": "Default Tool",
      "defaultToolPlaceholder": "Select a default tool",
      "defaultToolDescription": "Choose which tool is automatically selected when the application loads."
    }
    // ...
  },
  "toolNames": {
    "select": "Select Tool",
    "function": "Function Plot"
  }
  // ...
}
```

This implementation:

1. Adds a new "Display" tab to the configuration modal
2. Creates a toggle switch for toolbar visibility
3. Adds a dropdown to select the default tool
4. Includes help text for each setting
5. Adds necessary translation keys

The dropdown uses existing translation keys for shape names and adds new ones for the select and function tools. 