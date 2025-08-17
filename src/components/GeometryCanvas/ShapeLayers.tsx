import React from 'react';
import ShapeRenderer from '../GeometryCanvas/ShapeRenderer';
import PreviewShape from '../GeometryCanvas/PreviewShape';
import { AnyShape, Point, OperationMode, ShapeType, MeasurementUnit } from '@/types/shapes';
import { Z_INDEX } from '@/utils/constants';

interface ShapeLayersProps {
  scaledShapes: AnyShape[];
  selectedShapeId: string | null;
  activeMode: OperationMode;
  isNonInteractive: boolean;
  zoomedPixelsPerUnit: number;
  measurementUnit: MeasurementUnit;
  onShapeSelect: (id: string) => void;
  // Drawing state
  isDrawing: boolean;
  drawStart: Point | null;
  drawCurrent: Point | null;
  activeShapeType: ShapeType;
  // Event handlers
  onMouseDown?: (e: React.MouseEvent, shapeId: string) => void;
  onMouseMove?: (e: React.MouseEvent, shapeId: string) => void;
  onMouseUp?: (e: React.MouseEvent, shapeId: string) => void;
  onResizeStart?: (e: React.MouseEvent, shapeId: string) => void;
  onRotateStart?: (e: React.MouseEvent, shapeId: string) => void;
}

/**
 * Renders all shape-related layers including shapes and preview shape
 */
const ShapeLayers: React.FC<ShapeLayersProps> = React.memo(({
  scaledShapes,
  selectedShapeId,
  activeMode,
  isNonInteractive,
  zoomedPixelsPerUnit,
  measurementUnit,
  onShapeSelect,
  isDrawing,
  drawStart,
  drawCurrent,
  activeShapeType,
  onMouseDown,
  onMouseMove,
  onMouseUp,
  onResizeStart,
  onRotateStart,
}) => {
  return (
    <>
      {/* Render shapes with scaled values */}
      {scaledShapes.map(shape => (
        <div 
          key={shape.id}
          onClick={isNonInteractive ? undefined : () => onShapeSelect(shape.id)}
          style={{ 
            cursor: isNonInteractive ? 'default' : (activeMode === 'select' ? 'pointer' : 'default'),
            zIndex: Z_INDEX.SHAPES,
          }}
        >
          <ShapeRenderer
            shape={shape}
            selected={selectedShapeId === shape.id}
            measurementUnit={measurementUnit}
            pixelsPerUnit={zoomedPixelsPerUnit}
            onMouseDown={onMouseDown ? (e) => onMouseDown(e, shape.id) : undefined}
            onMouseMove={onMouseMove ? (e) => onMouseMove(e, shape.id) : undefined}
            onMouseUp={onMouseUp ? (e) => onMouseUp(e, shape.id) : undefined}
            onResizeStart={onResizeStart ? (e) => onResizeStart(e, shape.id) : undefined}
            onRotateStart={onRotateStart ? (e) => onRotateStart(e, shape.id) : undefined}
          />
        </div>
      ))}

      {/* Preview shape while drawing */}
      {isDrawing && drawStart && drawCurrent && activeMode === 'draw' && (
        <div style={{ zIndex: Z_INDEX.PREVIEW_SHAPE }}>
          <PreviewShape
            shapeType={activeShapeType}
            start={drawStart}
            current={drawCurrent}
            pixelsPerUnit={zoomedPixelsPerUnit}
          />
        </div>
      )}
    </>
  );
});

ShapeLayers.displayName = 'ShapeLayers';

export default ShapeLayers;