import { createContext } from 'react';
import { ShareViewOptions, defaultShareViewOptions } from '@/utils/urlEncoding';

export interface ShareViewOptionsContextType {
  shareViewOptions: ShareViewOptions;
  setShareViewOptions: (options: ShareViewOptions) => void;
  updateShareViewOption: <K extends keyof ShareViewOptions>(key: K, value: ShareViewOptions[K]) => void;
  resetToDefaults: () => void;
  generateShareUrl: () => string;
  generateEmbedCode: (width: number, height: number) => string;
}

export const ShareViewOptionsContext = createContext<ShareViewOptionsContextType>({
  shareViewOptions: defaultShareViewOptions,
  setShareViewOptions: () => {},
  updateShareViewOption: () => {},
  resetToDefaults: () => {},
  generateShareUrl: () => '',
  generateEmbedCode: () => '',
});