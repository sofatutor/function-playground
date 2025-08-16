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
  // Track SharePanel open state
  const [isSharePanelOpen, setIsSharePanelOpen] = useState(false);
  
  // Initialize from URL parameters or defaults
  const [shareViewOptions, setShareViewOptionsState] = useState<ShareViewOptions>(() => {
    if (typeof window !== 'undefined') {
      const urlOptions = parseShareViewOptionsFromUrl(window.location.search);
      // Override admin default with environment variable if not explicitly set in URL
      const urlParams = new URLSearchParams(window.location.search);
      if (!urlParams.has('admin')) {
        try {
          // @ts-expect-error - import.meta may not be available in some contexts
          if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-expect-error - import.meta may not be available in some contexts
            const envAdminMode = import.meta.env.VITE_ADMIN_MODE;
            urlOptions.admin = envAdminMode === 'true' || envAdminMode === '1';
          }
        } catch {
          // Fallback to default if import.meta is not available
        }
      }
      return urlOptions;
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
      ['layout', 'funcControls', 'fullscreen', 'tools', 'zoom', 'unitCtl', 'header', 'admin', 'lang'].forEach(key => {
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
    
    // For admin, layout, and lang changes, only update state without immediate URL update
    // They will be applied when SharePanel is closed or URL is manually loaded
    if (key === 'admin' || key === 'layout' || key === 'lang') {
      setShareViewOptionsState(newOptions);
      return;
    }
    
    // For all other options, apply immediately with live effects
    setShareViewOptions(newOptions);
  }, [shareViewOptions, setShareViewOptions]);

  const resetToDefaults = useCallback(() => {
    setShareViewOptions(defaultShareViewOptions);
  }, [setShareViewOptions]);

  const applyPendingChanges = useCallback(() => {
    // Apply admin and layout changes that were pending
    const applied = applyShareViewOptionsPrecedence(shareViewOptions);
    setShareViewOptionsState(applied);
    updateUrl(applied);
  }, [shareViewOptions, updateUrl]);

  const generateShareUrl = useCallback(() => {
    if (typeof window !== 'undefined') {
      // Get current URL without ShareViewOptions params
      const url = new URL(window.location.href);
      
      // Clear existing share-related params
      ['layout', 'funcControls', 'fullscreen', 'tools', 'zoom', 'unitCtl', 'header', 'admin', 'lang'].forEach(key => {
        url.searchParams.delete(key);
      });
      
      // Apply current ShareViewOptions state to generate the share URL
      const applied = applyShareViewOptionsPrecedence(shareViewOptions);
      const query = serializeShareViewOptionsToQuery(applied);
      
      // Add new params from current state
      if (query) {
        const params = new URLSearchParams(query);
        params.forEach((value, key) => {
          url.searchParams.set(key, value);
        });
      }
      
      return url.toString();
    }
    return '';
  }, [shareViewOptions]);

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
    applyPendingChanges,
    generateShareUrl,
    generateEmbedCode,
    isSharePanelOpen,
    setIsSharePanelOpen,
  };

  return (
    <ShareViewOptionsContext.Provider value={contextValue}>
      {children}
    </ShareViewOptionsContext.Provider>
  );
};