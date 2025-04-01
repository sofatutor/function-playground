import { renderHook, act } from '@testing-library/react';
import { useShapeOperations } from '@/hooks/useShapeOperations';
import { AnyShape, Point, OperationMode } from '@/types/shapes';
import * as _urlEncoding from '@/utils/urlEncoding';
import * as _commonUtils from '@/utils/geometry/common';

// Mock dependencies
jest.mock('@/utils/urlEncoding', () => ({
  updateUrlWithData: jest.fn(),
  getShapesFromUrl: jest.fn().mockReturnValue([]),
  getGridPositionFromUrl: jest.fn().mockReturnValue(null)
}));

jest.mock('@/utils/geometry/common', () => ({
  ...jest.requireActual('@/utils/geometry/common'),
  getStoredPixelsPerUnit: jest.fn().mockReturnValue(60) // Mock 60 pixels per unit
}));

jest.mock('@/context/ConfigContext', () => ({
  useComponentConfig: () => ({
    measurementUnit: 'cm',
    setMeasurementUnit: jest.fn()
  })
}));

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}));

// Mock service factory
jest.mock('@/providers/ServiceProvider', () => ({
  useServiceFactory: () => ({
    getService: jest.fn(() => ({
      createShape: jest.fn((params) => ({
        id: 'test-shape-id',
        type: 'rectangle',
        position: params.position || { x: 0, y: 0 },
        width: params.width || 100,
        height: params.height || 100,
        rotation: 0,
        fillColor: '#ffffff',
        strokeColor: '#000000',
        opacity: 1
      })),
      moveShape: jest.fn((shape, dx, dy) => ({
        ...shape,
        position: {
          x: shape.position.x + dx,
          y: shape.position.y + dy
        }
      })),
      resizeShape: jest.fn((shape, { scale }) => ({
        ...shape,
        width: shape.width * scale,
        height: shape.height * scale
      })),
      rotateShape: jest.fn((shape, angle) => ({
        ...shape,
        rotation: (shape.rotation || 0) + angle
      })),
      getMeasurements: jest.fn(() => ({
        width: 10,
        height: 10,
        area: 100,
        perimeter: 40
      })),
      updateFromMeasurement: jest.fn((shape) => shape)
    })),
    getServiceForShape: jest.fn(() => ({
      getMeasurements: jest.fn(() => ({
        width: 10,
        height: 10,
        area: 100,
        perimeter: 40
      }))
    }))
  })
}));

// Set up event object needed by some tests
Object.defineProperty(window, 'event', {
  value: {},
  writable: true
});

describe('useShapeOperations - basic functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should initialize with default values', () => {
    // Arrange & Act
    const { result } = renderHook(() => useShapeOperations());
    
    // Assert
    expect(result.current.shapes).toEqual([]);
    expect(result.current.selectedShapeId).toBeNull();
    expect(result.current.activeMode).toBe('select');
    expect(result.current.activeShapeType).toBe('rectangle');
    expect(result.current.dragStart).toBeNull();
    expect(result.current.gridPosition).toBeNull();
  });
  
  it('should set the active mode', () => {
    // Arrange
    const { result } = renderHook(() => useShapeOperations());
    const newMode: OperationMode = 'create';
    
    // Act
    act(() => {
      result.current.setActiveMode(newMode);
    });
    
    // Assert
    expect(result.current.activeMode).toBe(newMode);
  });
  
  it('should set the active shape type', () => {
    // Arrange
    const { result } = renderHook(() => useShapeOperations());
    
    // Act
    act(() => {
      result.current.setActiveShapeType('circle');
    });
    
    // Assert
    expect(result.current.activeShapeType).toBe('circle');
  });
  
  it('should update grid position for significant changes', () => {
    // Arrange
    const { result } = renderHook(() => useShapeOperations());
    const newPosition: Point = { x: 100, y: 100 };
    
    // Act
    act(() => {
      result.current.updateGridPosition(newPosition);
    });
    
    // Assert
    expect(result.current.gridPosition).toEqual(newPosition);
  });
  
  it('should get shape measurements through the service', () => {
    // Arrange
    const { result } = renderHook(() => useShapeOperations());
    const testShape: AnyShape = {
      id: 'test-id',
      type: 'rectangle',
      position: { x: 10, y: 10 },
      width: 100,
      height: 100,
      rotation: 0,
      fillColor: '#ffffff',
      strokeColor: '#000000',
      opacity: 1
    };
    
    // Act
    const measurements = result.current.getShapeMeasurements(testShape);
    
    // Assert
    expect(measurements).toEqual({
      width: 10,
      height: 10,
      area: 100,
      perimeter: 40
    });
  });
}); 