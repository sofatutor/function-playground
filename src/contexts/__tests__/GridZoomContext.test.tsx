import React from 'react';
import { render, act } from '@testing-library/react';
import { GridZoomProvider, useGridZoom } from '../GridZoomContext';

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

// Test component that uses the GridZoomContext
const TestComponent = () => {
  const { zoomFactor, zoomIn, zoomOut, setZoomFactor } = useGridZoom();
  return (
    <div>
      <div data-testid="zoom-factor">{zoomFactor}</div>
      <button data-testid="zoom-in" onClick={zoomIn}>Zoom In</button>
      <button data-testid="zoom-out" onClick={zoomOut}>Zoom Out</button>
      <button data-testid="zoom-reset" onClick={() => setZoomFactor(1)}>Reset</button>
    </div>
  );
};

describe('GridZoomContext', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should provide default zoom factor of 1', () => {
    const { getByTestId } = render(
      <GridZoomProvider>
        <TestComponent />
      </GridZoomProvider>
    );
    
    expect(getByTestId('zoom-factor').textContent).toBe('1');
  });

  it('should load zoom factor from localStorage if available', () => {
    localStorageMock.setItem('gridZoomFactor', '1.5');
    
    const { getByTestId } = render(
      <GridZoomProvider>
        <TestComponent />
      </GridZoomProvider>
    );
    
    expect(getByTestId('zoom-factor').textContent).toBe('1.5');
  });
}); 