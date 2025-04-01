import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DEFAULT_PIXELS_PER_CM, DEFAULT_PIXELS_PER_MM } from '@/components/GeometryCanvas/CanvasUtils';
import GridLines from '@/components/CanvasGrid/GridLines';

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
    },
    removeItem: (key: string) => {
      delete store[key];
    }
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('CanvasGrid', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  test('GridLines should render with correct pixelsPerMm value', () => {
    // Arrange
    const pixelsPerCm = 60;
    const pixelsPerMm = pixelsPerCm / 10; // This should always be 1/10th of pixelsPerCm
    
    // Spy on console.warn to catch any warnings
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    // Act
    render(
      <svg>
        <GridLines
          canvasSize={{ width: 800, height: 600 }}
          pixelsPerCm={pixelsPerCm}
          pixelsPerMm={pixelsPerMm}
          measurementUnit="cm"
          origin={{ x: 400, y: 300 }}
        />
      </svg>
    );
    
    // Assert
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    
    // Clean up
    consoleWarnSpy.mockRestore();
  });

  test('pixelsPerMm should always be 1/10th of pixelsPerCm', () => {
    // This test verifies the mathematical relationship
    expect(DEFAULT_PIXELS_PER_MM).toBe(DEFAULT_PIXELS_PER_CM / 10);
  });

  test('GridLines should render minor grid lines correctly', () => {
    // Arrange
    const pixelsPerCm = 60;
    const pixelsPerMm = pixelsPerCm / 10;
    
    // Act
    const { container } = render(
      <svg>
        <GridLines
          canvasSize={{ width: 800, height: 600 }}
          pixelsPerCm={pixelsPerCm}
          pixelsPerMm={pixelsPerMm}
          measurementUnit="cm"
          origin={{ x: 400, y: 300 }}
        />
      </svg>
    );
    
    // Assert
    // Check that we have both major and minor grid lines
    const lines = container.querySelectorAll('line');
    
    // Filter for major and minor lines based on stroke width
    const majorLines = Array.from(lines).filter(line => 
      line.getAttribute('stroke-width') === '0.5' || line.getAttribute('stroke-width') === '1'
    );
    
    const minorLines = Array.from(lines).filter(line => 
      line.getAttribute('stroke-width') === '0.2'
    );
    
    // We should have both major and minor lines
    expect(majorLines.length).toBeGreaterThan(0);
    expect(minorLines.length).toBeGreaterThan(0);
    
    // The ratio of minor to major lines should be roughly 9:1 (9 minor lines between each major line)
    // This is an approximation since the exact count depends on canvas size
    expect(minorLines.length).toBeGreaterThan(majorLines.length);
  });
}); 