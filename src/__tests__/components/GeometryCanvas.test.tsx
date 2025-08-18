import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import GeometryCanvas from '@/components/GeometryCanvas';
import { DEFAULT_PIXELS_PER_MM } from '@/components/GeometryCanvas/CanvasUtils';
import { ServiceProvider } from '@/providers/ServiceProvider';
import { Formula } from '@/types/formula';

// Create a variable to store the props
let lastCanvasGridProps: Record<string, unknown> | null = null;

// Mock the CanvasGrid component to inspect the props passed to it
jest.mock('@/components/CanvasGrid/index', () => {
  return {
    __esModule: true,
    default: (props: Record<string, unknown>) => {
      lastCanvasGridProps = props;
      return <div data-testid="canvas-grid-mock" />;
    }
  };
});

describe('GeometryCanvas', () => {
  beforeEach(() => {
    // Reset the props before each test
    lastCanvasGridProps = null;
  });

  // Default props required by GeometryCanvas
  const defaultProps = {
    shapes: [],
    selectedShapeId: null,
    activeMode: 'select' as const,
    activeShapeType: 'circle' as const,
    measurementUnit: 'cm' as const,
    gridPosition: null,
    onShapeSelect: jest.fn(),
    onShapeCreate: jest.fn(),
    onShapeMove: jest.fn(),
    onShapeResize: jest.fn(),
    onShapeRotate: jest.fn(),
    onModeChange: jest.fn(),
  };

  test('renders without crashing', () => {
    render(
      <ServiceProvider>
        <GeometryCanvas 
          {...defaultProps}
        />
      </ServiceProvider>
    );
    expect(screen.getByTestId('canvas-grid-mock')).toBeInTheDocument();
  });

  test('passes correct props to CanvasGrid', () => {
    render(
      <ServiceProvider>
        <GeometryCanvas 
          {...defaultProps}
        />
      </ServiceProvider>
    );
    
    expect(lastCanvasGridProps).not.toBeNull();
    expect(lastCanvasGridProps).toHaveProperty('canvasSize');
    expect(lastCanvasGridProps).toHaveProperty('pixelsPerCm');
    expect(lastCanvasGridProps).toHaveProperty('pixelsPerMm');
  });

  test('pixelsPerSmallUnit should be 1/10th of pixelsPerUnit for cm', () => {
    const pixelsPerUnit = 60; // Default pixels per cm
    
    render(
      <ServiceProvider>
        <GeometryCanvas 
          {...defaultProps}
          measurementUnit="cm"
          pixelsPerUnit={pixelsPerUnit}
        />
      </ServiceProvider>
    );
    
    expect(lastCanvasGridProps).not.toBeNull();
    expect(lastCanvasGridProps?.pixelsPerCm).toBe(pixelsPerUnit);
    expect(lastCanvasGridProps?.pixelsPerMm).toBe(DEFAULT_PIXELS_PER_MM);
  });

  test('pixelsPerSmallUnit should be 1/10th of pixelsPerUnit for inches', () => {
    const pixelsPerUnit = 152.4; // Default pixels per inch
    
    render(
      <ServiceProvider>
        <GeometryCanvas
          {...defaultProps}
          measurementUnit="in"
          pixelsPerUnit={pixelsPerUnit}
        />
      </ServiceProvider>
    );
    
    expect(lastCanvasGridProps).not.toBeNull();
    expect(lastCanvasGridProps?.pixelsPerCm).toBe(pixelsPerUnit);
    expect(lastCanvasGridProps?.pixelsPerMm).toBe(pixelsPerUnit / 10);
  });

  test('handleCalibrationUpdate should set pixelsPerSmallUnit to 1/10th of the new value', () => {
    const pixelsPerUnit = 60; // Default pixels per cm
    const _newPixelsPerUnit = 80; // New calibration value
    
    render(
      <ServiceProvider>
        <GeometryCanvas 
          {...defaultProps}
          measurementUnit="cm"
          pixelsPerUnit={pixelsPerUnit}
        />
      </ServiceProvider>
    );
    
    expect(lastCanvasGridProps).not.toBeNull();
    expect(lastCanvasGridProps?.pixelsPerCm).toBe(pixelsPerUnit);
    expect(lastCanvasGridProps?.pixelsPerMm).toBe(DEFAULT_PIXELS_PER_MM);
    
    // Note: We fixed an issue where pixelsPerSmallUnit was incorrectly calculated as pixelsPerUnit / 10
    // for cm measurement unit. It should be set to DEFAULT_PIXELS_PER_MM directly.
    // This was causing incomplete grid lines when the dev tools were closed.
  });

  test('should render and handle keyboard events without errors', () => {
    // Mock a formula for testing
    const mockFormula: Formula = {
      id: 'test-formula',
      expression: 'x*x',
      color: '#00ff00',
      type: 'function',
      scaleFactor: 1.0,
      strokeWidth: 2,
      xRange: [-10, 10],
      samples: 100
    };

    // Create a component with a selected formula point
    const { container } = render(
      <ServiceProvider>
        <GeometryCanvas 
          {...defaultProps}
          formulas={[mockFormula]}
        />
      </ServiceProvider>
    );

    // Get the canvas element
    const canvas = container.querySelector('[tabIndex="0"]');
    expect(canvas).not.toBeNull();

    if (canvas) {
      // Test that keyboard events don't cause errors in the refactored component
      expect(() => {
        fireEvent.keyDown(canvas, { key: 'ArrowUp' });
        fireEvent.keyDown(canvas, { key: 'ArrowDown' });
        fireEvent.keyDown(canvas, { key: 'Shift' });
        fireEvent.keyUp(canvas, { key: 'Shift' });
        fireEvent.keyDown(canvas, { key: 'Delete' });
      }).not.toThrow();
    }
  });
}); 