import React from 'react';
import { render, screen } from '@testing-library/react';
import FormulaGraph from '@/components/FormulaGraph';
import { Formula } from '@/types/formula';
import * as loggerModule from '@/utils/logger';

// Mock the logger
jest.mock('@/utils/logger', () => {
  const originalModule = jest.requireActual('@/utils/logger');
  return {
    ...originalModule,
    createLogger: jest.fn().mockImplementation(() => ({
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      setLevel: jest.fn()
    })),
    initLogger: jest.fn()
  };
});

describe('FormulaGraph', () => {
  const mockFormula: Formula = {
    id: 'test-formula',
    expression: 'x^2',
    color: '#ff0000',
    type: 'function',
    xRange: [-10, 10],
    samples: 100,
    scaleFactor: 1,
    strokeWidth: 2
  };

  const mockGridPosition = { x: 100, y: 100 };
  const mockPixelsPerUnit = 10;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(
      <FormulaGraph
        formula={mockFormula}
        gridPosition={mockGridPosition}
        pixelsPerUnit={mockPixelsPerUnit}
      />
    );
    // The component renders an SVG path, but it doesn't have any text content
    // So we just check that it renders without throwing an error
  });

  it('logs debug information when rendering', () => {
    // Mock console.log instead of checking initLogger
    const originalConsoleLog = console.log;
    console.log = jest.fn();
    
    render(
      <FormulaGraph
        formula={mockFormula}
        gridPosition={mockGridPosition}
        pixelsPerUnit={mockPixelsPerUnit}
      />
    );

    // Check that console.log was called with formula evaluation
    expect(console.log).toHaveBeenCalled();
    
    // Restore console.log
    console.log = originalConsoleLog;
  });
}); 