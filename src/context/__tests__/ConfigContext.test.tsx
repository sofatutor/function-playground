import { renderHook, act } from '@testing-library/react';
import { ConfigProvider, useGlobalConfig } from '../ConfigContext';

describe('ConfigContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ConfigProvider>{children}</ConfigProvider>
  );

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('defaultTool', () => {
    it('should initialize with "circle" as default value when no stored value exists', () => {
      const { result } = renderHook(() => useGlobalConfig(), { wrapper });
      expect(result.current.defaultTool).toBe('circle');
    });

    it('should load stored value from localStorage when available', () => {
      localStorage.setItem('def_tool', 'rectangle');
      const { result } = renderHook(() => useGlobalConfig(), { wrapper });
      expect(result.current.defaultTool).toBe('rectangle');
    });

    it('should update localStorage when defaultTool is changed', () => {
      const { result } = renderHook(() => useGlobalConfig(), { wrapper });
      
      act(() => {
        result.current.setDefaultTool('line');
      });

      expect(result.current.defaultTool).toBe('line');
      expect(localStorage.getItem('def_tool')).toBe('line');
    });
  });
}); 