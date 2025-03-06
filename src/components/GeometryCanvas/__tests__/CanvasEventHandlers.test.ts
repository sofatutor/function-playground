import { createHandleKeyDown } from '../CanvasEventHandlers';
import { AnyShape, Point } from '@/types/shapes';

describe('CanvasEventHandlers', () => {
  describe('createHandleKeyDown', () => {
    // Mock shape for testing
    const mockShape: AnyShape = {
      id: 'test-shape-1',
      type: 'rectangle',
      position: { x: 100, y: 100 },
      width: 50,
      height: 50,
      rotation: 0,
      selected: true,
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 1
    };

    // Create base mock params
    const createMockParams = () => ({
      canvasRef: { current: document.createElement('div') } as React.RefObject<HTMLDivElement>,
      shapes: [mockShape],
      activeMode: 'select' as const,
      activeShapeType: 'rectangle' as const,
      selectedShapeId: 'test-shape-1',
      isDrawing: false,
      drawStart: null as Point | null,
      drawCurrent: null as Point | null,
      dragStart: null as Point | null,
      originalPosition: null as Point | null,
      resizeStart: null as Point | null,
      originalSize: null as number | null,
      rotateStart: null as Point | null,
      originalRotation: 0,
      pixelsPerUnit: 10,
      pixelsPerSmallUnit: 1,
      measurementUnit: 'cm',
      gridPosition: { x: 0, y: 0 },
      setIsDrawing: jest.fn(),
      setDrawStart: jest.fn(),
      setDrawCurrent: jest.fn(),
      setDragStart: jest.fn(),
      setOriginalPosition: jest.fn(),
      setResizeStart: jest.fn(),
      setOriginalSize: jest.fn(),
      setRotateStart: jest.fn(),
      setOriginalRotation: jest.fn(),
      onShapeSelect: jest.fn(),
      onShapeCreate: jest.fn(),
      onShapeMove: jest.fn(),
      onShapeResize: jest.fn(),
      onShapeRotate: jest.fn(),
      onShapeDelete: jest.fn()
    });

    it('should call onShapeDelete when Backspace key is pressed', () => {
      // Create fresh mock params for this test
      const mockParams = createMockParams();
      
      // Create the key down handler
      const handleKeyDown = createHandleKeyDown(mockParams);
      
      // Create a mock keyboard event for Backspace
      const mockEvent = new KeyboardEvent('keydown', { key: 'Backspace' });
      
      // Call the handler with the mock event
      handleKeyDown(mockEvent);
      
      // Verify that onShapeDelete was called with the correct shape ID
      expect(mockParams.onShapeDelete).toHaveBeenCalledWith('test-shape-1');
    });

    it('should call onShapeDelete when Delete key is pressed', () => {
      // Create fresh mock params for this test
      const mockParams = createMockParams();
      
      // Create the key down handler
      const handleKeyDown = createHandleKeyDown(mockParams);
      
      // Create a mock keyboard event for Delete
      const mockEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      
      // Call the handler with the mock event
      handleKeyDown(mockEvent);
      
      // Verify that onShapeDelete was called with the correct shape ID
      expect(mockParams.onShapeDelete).toHaveBeenCalledWith('test-shape-1');
    });

    it('should not call onShapeDelete when no shape is selected', () => {
      // Create fresh mock params for this test with no selected shape
      const mockParams = createMockParams();
      mockParams.selectedShapeId = null;
      
      // Create the key down handler
      const handleKeyDown = createHandleKeyDown(mockParams);
      
      // Create a mock keyboard event for Backspace
      const mockEvent = new KeyboardEvent('keydown', { key: 'Backspace' });
      
      // Call the handler with the mock event
      handleKeyDown(mockEvent);
      
      // Verify that onShapeDelete was not called
      expect(mockParams.onShapeDelete).not.toHaveBeenCalled();
    });

    it('should not call onShapeDelete when onShapeDelete is not provided', () => {
      // Create fresh mock params for this test with no onShapeDelete function
      const mockParams = createMockParams();
      mockParams.onShapeDelete = undefined;
      
      // Create the key down handler
      const handleKeyDown = createHandleKeyDown(mockParams);
      
      // Create a mock keyboard event for Backspace
      const mockEvent = new KeyboardEvent('keydown', { key: 'Backspace' });
      
      // Call the handler with the mock event
      handleKeyDown(mockEvent);
      
      // No assertion needed as we're just making sure it doesn't throw an error
    });
  });
}); 