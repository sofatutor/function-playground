import React from 'react';
import { render, screen } from '@testing-library/react';
import { useGridZoom, GridZoomProvider } from '../GridZoomContext';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Test component that uses the hook
const TestComponent = () => {
  const { zoomFactor } = useGridZoom();
  return <div data-testid="zoom-factor">{zoomFactor}</div>;
};

describe('GridZoomContext', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  it('should have default zoom factor of 1', () => {
    render(
      <GridZoomProvider>
        <TestComponent />
      </GridZoomProvider>
    );

    expect(screen.getByTestId('zoom-factor').textContent).toBe('1');
  });

  it('should load zoom factor from localStorage if available', () => {
    // Setting zoom factor in localStorage before rendering the component
    localStorage.setItem('gridZoomFactor', '1.5');
    
    render(
      <GridZoomProvider>
        <TestComponent />
      </GridZoomProvider>
    );
    
    expect(screen.getByTestId('zoom-factor').textContent).toBe('1.5');
  });
}); 