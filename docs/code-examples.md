# Geo-Playground Code Examples and Tutorials

This document provides code examples and tutorials for developers who want to extend or customize the Geo-Playground application.

## Table of Contents

1. [Working with Shape Services](#working-with-shape-services)
2. [Creating Custom Shapes](#creating-custom-shapes)
3. [Adding New Operations](#adding-new-operations)
4. [Custom Rendering](#custom-rendering)
5. [Testing Strategies](#testing-strategies)

## Working with Shape Services

The Geo-Playground application uses a service-based architecture for managing shapes. Each shape type has its own service implementation that extends the base `ShapeService` interface.

### Using Shape Services

Here's an example of how to use shape services to create and manipulate shapes:

```typescript
import { ShapeServiceFactory } from '../services/ShapeServiceFactory';

// Get the circle service
const circleService = ShapeServiceFactory.getService('circle');

// Create a circle
const circle = circleService.create({
  center: { x: 100, y: 100 },
  radius: 50,
  fill: 'red',
  stroke: 'black',
  strokeWidth: 2,
});

// Move the circle
const movedCircle = circleService.move(circle, 10, 20);

// Resize the circle
const resizedCircle = circleService.resize(circle, 1.5);

// Rotate the circle (has no visual effect but updates the rotation property)
const rotatedCircle = circleService.rotate(circle, 45);

// Check if a point is inside the circle
const isInside = circleService.containsPoint(circle, { x: 110, y: 110 });

// Get the area of the circle
const area = circleService.getArea(circle);
```

### Using the Shape Service Factory

The `ShapeServiceFactory` provides a way to get the appropriate service for a given shape type:

```typescript
import { ShapeServiceFactory } from '../services/ShapeServiceFactory';
import { Shape } from '../types/shapes';

function manipulateShape(shape: Shape) {
  // Get the appropriate service for the shape type
  const shapeService = ShapeServiceFactory.getService(shape.type);
  
  // Use the service to manipulate the shape
  const movedShape = shapeService.move(shape, 10, 10);
  const resizedShape = shapeService.resize(movedShape, 1.2);
  
  return resizedShape;
}
```

## Creating Custom Shapes

To add a new shape type to the application, you need to:

1. Define the shape interface
2. Create a service implementation
3. Update the factory
4. Add utility functions
5. Add rendering logic

### Step 1: Define the Shape Interface

```typescript
// src/types/shapes.ts
export interface Ellipse extends Shape {
  type: 'ellipse';
  center: Point;
  radiusX: number;
  radiusY: number;
  rotation: number;
}

// Update the ShapeType union
export type ShapeType = 'circle' | 'rectangle' | 'triangle' | 'line' | 'ellipse';
```

### Step 2: Create a Service Implementation

```typescript
// src/services/implementations/EllipseServiceImpl.ts
import { ShapeService } from '../ShapeService';
import { Ellipse, Point } from '../../types/shapes';

export class EllipseServiceImpl implements ShapeService<Ellipse> {
  create(params: EllipseCreationParams): Ellipse {
    const { center, radiusX, radiusY, ...rest } = params;
    
    return {
      id: generateId(),
      type: 'ellipse',
      center,
      radiusX: Math.max(radiusX, 1),
      radiusY: Math.max(radiusY, 1),
      rotation: 0,
      ...rest,
    };
  }
  
  move(ellipse: Ellipse, dx: number, dy: number): Ellipse {
    return {
      ...ellipse,
      center: {
        x: ellipse.center.x + dx,
        y: ellipse.center.y + dy,
      },
    };
  }
  
  resize(ellipse: Ellipse, scale: number, anchor?: Point): Ellipse {
    const center = anchor || ellipse.center;
    
    // Calculate new center if resizing from an anchor point
    let newCenter = { ...ellipse.center };
    if (anchor) {
      const dx = ellipse.center.x - anchor.x;
      const dy = ellipse.center.y - anchor.y;
      newCenter = {
        x: anchor.x + dx * scale,
        y: anchor.y + dy * scale,
      };
    }
    
    return {
      ...ellipse,
      center: newCenter,
      radiusX: Math.max(ellipse.radiusX * scale, 1),
      radiusY: Math.max(ellipse.radiusY * scale, 1),
    };
  }
  
  rotate(ellipse: Ellipse, angle: number, center?: Point): Ellipse {
    const rotationCenter = center || ellipse.center;
    
    // If rotating around the ellipse center, just update the rotation
    if (rotationCenter.x === ellipse.center.x && rotationCenter.y === ellipse.center.y) {
      return {
        ...ellipse,
        rotation: (ellipse.rotation + angle) % 360,
      };
    }
    
    // If rotating around a different point, calculate the new center
    const rotatedCenter = rotatePoint(ellipse.center, rotationCenter, angle);
    
    return {
      ...ellipse,
      center: rotatedCenter,
      rotation: (ellipse.rotation + angle) % 360,
    };
  }
  
  getArea(ellipse: Ellipse): number {
    return Math.PI * ellipse.radiusX * ellipse.radiusY;
  }
  
  getPerimeter(ellipse: Ellipse): number {
    // Approximation of ellipse perimeter
    const a = Math.max(ellipse.radiusX, ellipse.radiusY);
    const b = Math.min(ellipse.radiusX, ellipse.radiusY);
    return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
  }
  
  containsPoint(ellipse: Ellipse, point: Point): boolean {
    // Transform the point to account for ellipse rotation
    const transformedPoint = rotatePoint(point, ellipse.center, -ellipse.rotation);
    
    // Check if the transformed point is inside the ellipse
    const dx = (transformedPoint.x - ellipse.center.x) / ellipse.radiusX;
    const dy = (transformedPoint.y - ellipse.center.y) / ellipse.radiusY;
    
    return dx * dx + dy * dy <= 1;
  }
}
```

### Step 3: Update the Factory

```typescript
// src/services/ShapeServiceFactory.ts
import { EllipseServiceImpl } from './implementations/EllipseServiceImpl';

class ShapeServiceFactory {
  static getService<T extends Shape>(type: ShapeType): ShapeService<T> {
    switch (type) {
      case 'circle':
        return new CircleServiceImpl() as unknown as ShapeService<T>;
      case 'rectangle':
        return new RectangleServiceImpl() as unknown as ShapeService<T>;
      case 'triangle':
        return new TriangleServiceImpl() as unknown as ShapeService<T>;
      case 'line':
        return new LineServiceImpl() as unknown as ShapeService<T>;
      case 'ellipse':
        return new EllipseServiceImpl() as unknown as ShapeService<T>;
      default:
        throw new Error(`Unsupported shape type: ${type}`);
    }
  }
}
```

### Step 4: Add Utility Functions

```typescript
// src/utils/geometry/shapeCreation.ts
export function createEllipse(params: EllipseCreationParams): Ellipse {
  const ellipseService = new EllipseServiceImpl();
  return ellipseService.create(params);
}

// src/utils/geometry/shapeUtils.ts
export function drawEllipse(
  ctx: CanvasRenderingContext2D,
  ellipse: Ellipse
): void {
  ctx.save();
  
  // Translate to the center of the ellipse
  ctx.translate(ellipse.center.x, ellipse.center.y);
  
  // Rotate the context
  ctx.rotate((ellipse.rotation * Math.PI) / 180);
  
  // Draw the ellipse
  ctx.beginPath();
  ctx.ellipse(0, 0, ellipse.radiusX, ellipse.radiusY, 0, 0, 2 * Math.PI);
  ctx.restore();
  
  // Apply fill and stroke
  if (ellipse.fill) {
    ctx.fillStyle = ellipse.fill;
    ctx.fill();
  }
  
  if (ellipse.stroke) {
    ctx.strokeStyle = ellipse.stroke;
    ctx.lineWidth = ellipse.strokeWidth || 1;
    ctx.stroke();
  }
}
```

### Step 5: Add Rendering Logic

```typescript
// src/components/ShapeRenderer.tsx
function renderShape(ctx: CanvasRenderingContext2D, shape: Shape): void {
  switch (shape.type) {
    case 'circle':
      drawCircle(ctx, shape as Circle);
      break;
    case 'rectangle':
      drawRectangle(ctx, shape as Rectangle);
      break;
    case 'triangle':
      drawTriangle(ctx, shape as Triangle);
      break;
    case 'line':
      drawLine(ctx, shape as Line);
      break;
    case 'ellipse':
      drawEllipse(ctx, shape as Ellipse);
      break;
    default:
      console.warn(`Unsupported shape type: ${shape.type}`);
  }
}
```

## Adding New Operations

To add a new operation to the shape services:

### Step 1: Update the ShapeService Interface

```typescript
// src/services/ShapeService.ts
export interface ShapeService<T extends Shape> {
  // Existing methods...
  
  // New method
  scale(shape: T, scaleX: number, scaleY: number, anchor?: Point): T;
}
```

### Step 2: Implement the Operation in Each Service

```typescript
// src/services/implementations/CircleServiceImpl.ts
scale(circle: Circle, scaleX: number, scaleY: number, anchor?: Point): Circle {
  // For a circle, we'll use the average of scaleX and scaleY
  const avgScale = (scaleX + scaleY) / 2;
  return this.resize(circle, avgScale, anchor);
}

// src/services/implementations/RectangleServiceImpl.ts
scale(rectangle: Rectangle, scaleX: number, scaleY: number, anchor?: Point): Rectangle {
  const center = anchor || {
    x: rectangle.position.x + rectangle.width / 2,
    y: rectangle.position.y + rectangle.height / 2,
  };
  
  // Calculate new position if scaling from an anchor point
  let newPosition = { ...rectangle.position };
  if (anchor) {
    const topLeft = rectangle.position;
    const dx = topLeft.x - anchor.x;
    const dy = topLeft.y - anchor.y;
    newPosition = {
      x: anchor.x + dx * scaleX,
      y: anchor.y + dy * scaleY,
    };
  }
  
  return {
    ...rectangle,
    position: newPosition,
    width: Math.max(rectangle.width * scaleX, 1),
    height: Math.max(rectangle.height * scaleY, 1),
  };
}
```

### Step 3: Add Utility Functions

```typescript
// src/utils/geometry/shapeOperations.ts
export function scaleShape(
  shape: Shape,
  scaleX: number,
  scaleY: number,
  anchor?: Point
): Shape {
  const shapeService = ShapeServiceFactory.getService(shape.type);
  return shapeService.scale(shape, scaleX, scaleY, anchor);
}
```

## Custom Rendering

To customize the rendering of shapes:

### Custom Fill Patterns

```typescript
function createPatternFill(
  ctx: CanvasRenderingContext2D,
  patternType: 'stripes' | 'dots' | 'grid',
  color: string
): CanvasPattern | null {
  const patternCanvas = document.createElement('canvas');
  patternCanvas.width = 20;
  patternCanvas.height = 20;
  const patternCtx = patternCanvas.getContext('2d');
  
  if (!patternCtx) return null;
  
  patternCtx.fillStyle = 'transparent';
  patternCtx.fillRect(0, 0, 20, 20);
  patternCtx.strokeStyle = color;
  patternCtx.lineWidth = 2;
  
  switch (patternType) {
    case 'stripes':
      patternCtx.beginPath();
      for (let i = 0; i < 20; i += 4) {
        patternCtx.moveTo(0, i);
        patternCtx.lineTo(20, i);
      }
      patternCtx.stroke();
      break;
    case 'dots':
      for (let i = 5; i < 20; i += 10) {
        for (let j = 5; j < 20; j += 10) {
          patternCtx.beginPath();
          patternCtx.arc(i, j, 2, 0, 2 * Math.PI);
          patternCtx.fillStyle = color;
          patternCtx.fill();
        }
      }
      break;
    case 'grid':
      patternCtx.beginPath();
      for (let i = 0; i < 20; i += 10) {
        patternCtx.moveTo(0, i);
        patternCtx.lineTo(20, i);
        patternCtx.moveTo(i, 0);
        patternCtx.lineTo(i, 20);
      }
      patternCtx.stroke();
      break;
  }
  
  return ctx.createPattern(patternCanvas, 'repeat');
}

// Usage in shape rendering
function drawCircleWithPattern(
  ctx: CanvasRenderingContext2D,
  circle: Circle,
  patternType: 'stripes' | 'dots' | 'grid'
): void {
  ctx.beginPath();
  ctx.arc(circle.center.x, circle.center.y, circle.radius, 0, 2 * Math.PI);
  
  const pattern = createPatternFill(ctx, patternType, circle.stroke || 'black');
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fill();
  }
  
  if (circle.stroke) {
    ctx.strokeStyle = circle.stroke;
    ctx.lineWidth = circle.strokeWidth || 1;
    ctx.stroke();
  }
}
```

### Custom Shape Highlighting

```typescript
function drawSelectedShape(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  highlightColor: string = '#00a8ff'
): void {
  // First draw the shape normally
  renderShape(ctx, shape);
  
  // Then draw the selection highlight
  ctx.save();
  ctx.strokeStyle = highlightColor;
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 3]);
  
  switch (shape.type) {
    case 'circle':
      const circle = shape as Circle;
      ctx.beginPath();
      ctx.arc(circle.center.x, circle.center.y, circle.radius + 5, 0, 2 * Math.PI);
      ctx.stroke();
      break;
    case 'rectangle':
      const rect = shape as Rectangle;
      ctx.beginPath();
      ctx.rect(
        rect.position.x - 5,
        rect.position.y - 5,
        rect.width + 10,
        rect.height + 10
      );
      ctx.stroke();
      break;
    // Add cases for other shape types
  }
  
  ctx.restore();
}
```

## Testing Strategies

### Unit Testing Shape Services

```typescript
// src/__tests__/services/EllipseServiceImpl.test.ts
import { EllipseServiceImpl } from '../../services/implementations/EllipseServiceImpl';
import { Ellipse } from '../../types/shapes';

describe('EllipseServiceImpl', () => {
  let ellipseService: EllipseServiceImpl;
  let ellipse: Ellipse;
  
  beforeEach(() => {
    ellipseService = new EllipseServiceImpl();
    ellipse = {
      id: '1',
      type: 'ellipse',
      center: { x: 100, y: 100 },
      radiusX: 50,
      radiusY: 30,
      rotation: 0,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 2,
    };
  });
  
  describe('create', () => {
    it('should create an ellipse with the given parameters', () => {
      const params = {
        center: { x: 100, y: 100 },
        radiusX: 50,
        radiusY: 30,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 2,
      };
      
      const result = ellipseService.create(params);
      
      expect(result).toMatchObject({
        type: 'ellipse',
        center: { x: 100, y: 100 },
        radiusX: 50,
        radiusY: 30,
        rotation: 0,
        fill: 'red',
        stroke: 'black',
        strokeWidth: 2,
      });
      expect(result.id).toBeDefined();
    });
    
    it('should enforce minimum radius values', () => {
      const params = {
        center: { x: 100, y: 100 },
        radiusX: -10,
        radiusY: 0,
      };
      
      const result = ellipseService.create(params);
      
      expect(result.radiusX).toBe(1);
      expect(result.radiusY).toBe(1);
    });
  });
  
  describe('move', () => {
    it('should move the ellipse by the given deltas', () => {
      const result = ellipseService.move(ellipse, 10, -20);
      
      expect(result).toEqual({
        ...ellipse,
        center: { x: 110, y: 80 },
      });
    });
  });
  
  describe('resize', () => {
    it('should resize the ellipse from its center', () => {
      const result = ellipseService.resize(ellipse, 2);
      
      expect(result).toEqual({
        ...ellipse,
        radiusX: 100,
        radiusY: 60,
      });
    });
    
    it('should resize the ellipse from an anchor point', () => {
      const anchor = { x: 50, y: 50 };
      const result = ellipseService.resize(ellipse, 2, anchor);
      
      expect(result).toEqual({
        ...ellipse,
        center: { x: 150, y: 150 },
        radiusX: 100,
        radiusY: 60,
      });
    });
  });
  
  // Add more tests for other methods
});
```

### Testing Shape Rendering

```typescript
// src/__tests__/utils/rendering.test.ts
import { drawEllipse } from '../../utils/geometry/shapeUtils';
import { Ellipse } from '../../types/shapes';

describe('Shape Rendering', () => {
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let ellipse: Ellipse;
  
  beforeEach(() => {
    // Set up a canvas for testing
    canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    ctx = canvas.getContext('2d')!;
    
    // Create a test ellipse
    ellipse = {
      id: '1',
      type: 'ellipse',
      center: { x: 100, y: 100 },
      radiusX: 50,
      radiusY: 30,
      rotation: 0,
      fill: 'red',
      stroke: 'black',
      strokeWidth: 2,
    };
    
    // Spy on canvas methods
    jest.spyOn(ctx, 'beginPath');
    jest.spyOn(ctx, 'ellipse');
    jest.spyOn(ctx, 'fill');
    jest.spyOn(ctx, 'stroke');
  });
  
  it('should draw an ellipse with the correct parameters', () => {
    drawEllipse(ctx, ellipse);
    
    expect(ctx.beginPath).toHaveBeenCalled();
    expect(ctx.ellipse).toHaveBeenCalledWith(0, 0, 50, 30, 0, 0, 2 * Math.PI);
    expect(ctx.fill).toHaveBeenCalled();
    expect(ctx.stroke).toHaveBeenCalled();
  });
  
  it('should apply the correct fill and stroke styles', () => {
    drawEllipse(ctx, ellipse);
    
    expect(ctx.fillStyle).toBe('red');
    expect(ctx.strokeStyle).toBe('black');
    expect(ctx.lineWidth).toBe(2);
  });
  
  it('should apply rotation transformation', () => {
    const rotatedEllipse = { ...ellipse, rotation: 45 };
    
    jest.spyOn(ctx, 'rotate');
    
    drawEllipse(ctx, rotatedEllipse);
    
    expect(ctx.rotate).toHaveBeenCalledWith((45 * Math.PI) / 180);
  });
});
```

These examples and tutorials should help developers understand how to work with and extend the Geo-Playground application. 