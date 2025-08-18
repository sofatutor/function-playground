import React from 'react';
import ShapeRenderer from '../GeometryCanvas/ShapeRenderer';
import PreviewShape from '../GeometryCanvas/PreviewShape';
import { AnyShape, Point, OperationMode, ShapeType } from '@/types/shapes';
import { Z_INDEX } from '@/utils/constants';

interface ShapeLayersProps {
  scaledShapes: AnyShape[];
  selectedShapeId: string | null;
  activeMode: OperationMode;
  isNonInteractive: boolean;
  onShapeSelect: (id: string) => void;
  // Drawing state
  isDrawing: boolean;
  drawStart: Point | null;
  drawCurrent: Point | null;
  activeShapeType: ShapeType;
}

/**
 * Renders all shape-related layers including shapes and preview shape
 */
const ShapeLayers: React.FC<ShapeLayersProps> = React.memo(({
  scaledShapes,
  selectedShapeId,
  activeMode,
  isNonInteractive,
  onShapeSelect,
  isDrawing,
  drawStart,
  drawCurrent,
  activeShapeType,
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
            isSelected={selectedShapeId === shape.id}
            activeMode={activeMode}
          />
        </div>
      ))}

      {/* Preview shape while drawing */}
      {isDrawing && drawStart && drawCurrent && (
        <div style={{ zIndex: Z_INDEX.PREVIEW_SHAPE }}>
          <PreviewShape
            isDrawing={isDrawing}
            drawStart={drawStart}
            drawCurrent={drawCurrent}
            activeShapeType={activeShapeType}
          />
        </div>
      )}
    </>
  );
});

ShapeLayers.displayName = 'ShapeLayers';

export default ShapeLayers;