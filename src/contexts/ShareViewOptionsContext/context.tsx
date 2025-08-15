import { createContext } from 'react';
import { ShareViewOptions, defaultShareViewOptions } from '@/utils/urlEncoding';

export interface ShareViewOptionsContextType {
  shareViewOptions: ShareViewOptions;
  setShareViewOptions: (options: ShareViewOptions) => void;
  updateShareViewOption: <K extends keyof ShareViewOptions>(key: K, value: ShareViewOptions[K]) => void;
  resetToDefaults: () => void;
  generateShareUrl: () => string;
  generateEmbedCode: (width: number, height: number) => string;
  isSharePanelOpen: boolean;
  setIsSharePanelOpen: (open: boolean) => void;
}

export const ShareViewOptionsContext = createContext<ShareViewOptionsContextType>({
  shareViewOptions: defaultShareViewOptions,
  setShareViewOptions: () => {
    // Default implementation - will be overridden by provider
  },
  updateShareViewOption: () => {
    // Default implementation - will be overridden by provider
  },
  resetToDefaults: () => {
    // Default implementation - will be overridden by provider
  },
  generateShareUrl: () => '',
  generateEmbedCode: () => '',
  isSharePanelOpen: false,
  setIsSharePanelOpen: () => {
    // Default implementation - will be overridden by provider
  },
});