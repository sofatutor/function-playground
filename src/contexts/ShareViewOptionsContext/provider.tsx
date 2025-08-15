import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { ShareViewOptionsContext, ShareViewOptionsContextType } from './context';
import { 
  ShareViewOptions, 
  defaultShareViewOptions, 
  parseShareViewOptionsFromUrl,
  serializeShareViewOptionsToQuery,
  applyShareViewOptionsPrecedence 
} from '@/utils/urlEncoding';

interface ShareViewOptionsProviderProps {
  children: ReactNode;
}

export const ShareViewOptionsProvider: React.FC<ShareViewOptionsProviderProps> = ({ children }) => {
  // Initialize from URL parameters or defaults
  const [shareViewOptions, setShareViewOptionsState] = useState<ShareViewOptions>(() => {
    if (typeof window !== 'undefined') {
      return parseShareViewOptionsFromUrl(window.location.search);
    }
    return defaultShareViewOptions;
  });

  // Update URL when options change
  const updateUrl = useCallback((options: ShareViewOptions) => {
    if (typeof window !== 'undefined') {
      const applied = applyShareViewOptionsPrecedence(options);
      const query = serializeShareViewOptionsToQuery(applied);
      
      // Get current URL and update search params
      const url = new URL(window.location.href);
      
      // Parse the query and update params
      const params = new URLSearchParams(query);
      
      // Clear existing share-related params
      ['layout', 'funcOnly', 'fullscreen', 'tools', 'zoom', 'unitCtl', 'header', 'lang'].forEach(key => {
        url.searchParams.delete(key);
      });
      
      // Add new params
      params.forEach((value, key) => {
        url.searchParams.set(key, value);
      });
      
      // Update URL without page reload
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  const setShareViewOptions = useCallback((options: ShareViewOptions) => {
    const applied = applyShareViewOptionsPrecedence(options);
    setShareViewOptionsState(applied);
    updateUrl(applied);
  }, [updateUrl]);

  const updateShareViewOption = useCallback(<K extends keyof ShareViewOptions>(
    key: K, 
    value: ShareViewOptions[K]
  ) => {
    const newOptions = { ...shareViewOptions, [key]: value };
    setShareViewOptions(newOptions);
  }, [shareViewOptions, setShareViewOptions]);

  const resetToDefaults = useCallback(() => {
    setShareViewOptions(defaultShareViewOptions);
  }, [setShareViewOptions]);

  const generateShareUrl = useCallback(() => {
    if (typeof window !== 'undefined') {
      return window.location.href;
    }
    return '';
  }, []);

  const generateEmbedCode = useCallback((width: number, height: number) => {
    const url = generateShareUrl();
    return `<iframe src="${url}" width="${width}" height="${height}" frameborder="0" title="Function Playground"></iframe>`;
  }, [generateShareUrl]);

  // Listen for URL changes (back/forward navigation)
  useEffect(() => {
    const handlePopState = () => {
      const newOptions = parseShareViewOptionsFromUrl(window.location.search);
      setShareViewOptionsState(newOptions);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const contextValue: ShareViewOptionsContextType = {
    shareViewOptions,
    setShareViewOptions,
    updateShareViewOption,
    resetToDefaults,
    generateShareUrl,
    generateEmbedCode,
  };

  return (
    <ShareViewOptionsContext.Provider value={contextValue}>
      {children}
    </ShareViewOptionsContext.Provider>
  );
};