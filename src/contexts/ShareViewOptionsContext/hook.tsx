import { useContext } from 'react';
import { ShareViewOptionsContext, ShareViewOptionsContextType } from './context';

export const useShareViewOptions = (): ShareViewOptionsContextType => {
  const context = useContext(ShareViewOptionsContext);
  if (!context) {
    throw new Error('useShareViewOptions must be used within a ShareViewOptionsProvider');
  }
  return context;
};