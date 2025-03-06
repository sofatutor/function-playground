# Geo-Playground API Documentation

## Overview

This document provides comprehensive documentation for the Geo-Playground API, focusing on the shape services and utilities that form the core of the application.

## Table of Contents

1. [Shape Types](#shape-types)
2. [Shape Services](#shape-services)
3. [Geometry Utilities](#geometry-utilities)
4. [Common Operations](#common-operations)
5. [Error Handling](#error-handling)

## Shape Types

The application supports the following shape types:

### Circle

```typescript
interface Circle extends Shape {
  type: 'circle';
  radius: number;
  center: Point;
}
```

A circle is defined by its center point and radius.

### Rectangle

```typescript
interface Rectangle extends Shape {
  type: 'rectangle';
  width: number;
  height: number;
  position: Point;
  rotation: number;
}
```

A rectangle is defined by its position (top-left corner), width, height, and rotation angle.

### Triangle

```typescript
interface Triangle extends Shape {
  type: 'triangle';
  points: [Point, Point, Point];
  rotation: number;
}
```

A triangle is defined by its three points and rotation angle.

### Line

```typescript
interface Line extends Shape {
  type: 'line';
  start: Point;
  end: Point;
}
```

A line is defined by its start and end points.

## Shape Services

The application uses a service-based architecture for managing shapes. Each shape type has its own service implementation.

### ShapeService Interface

```typescript
interface ShapeService<T extends Shape> {
  create(params: ShapeCreationParams): T;
  update(shape: T, updates: Partial<T>): T;
  move(shape: T, dx: number, dy: number): T;
  resize(shape: T, scale: number, anchor?: Point): T;
  rotate(shape: T, angle: number, center?: Point): T;
  getArea(shape: T): number;
  getPerimeter(shape: T): number;
  containsPoint(shape: T, point: Point): boolean;
}
```

### ShapeServiceFactory

The `ShapeServiceFactory` provides a way to get the appropriate service for a given shape type:

```typescript
const shapeService = ShapeServiceFactory.getService(shape.type);
```

### CircleService

The `CircleService` provides operations specific to circles:

```typescript
// Create a circle
const circle = circleService.create({ center: { x: 100, y: 100 }, radius: 50 });

// Resize a circle
const resizedCircle = circleService.resize(circle, 1.5);

// Get the area of a circle
const area = circleService.getArea(circle);
```

### RectangleService

The `RectangleService` provides operations specific to rectangles:

```typescript
// Create a rectangle
const rectangle = rectangleService.create({ 
  position: { x: 100, y: 100 }, 
  width: 200, 
  height: 100 
});

// Rotate a rectangle
const rotatedRectangle = rectangleService.rotate(rectangle, 45);

// Check if a point is inside a rectangle
const isInside = rectangleService.containsPoint(rectangle, { x: 150, y: 150 });
```

### TriangleService

The `TriangleService` provides operations specific to triangles:

```typescript
// Create a triangle
const triangle = triangleService.create({ 
  points: [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 150, y: 50 }
  ]
});

// Get the perimeter of a triangle
const perimeter = triangleService.getPerimeter(triangle);
```

### LineService

The `LineService` provides operations specific to lines:

```typescript
// Create a line
const line = lineService.create({ 
  start: { x: 100, y: 100 }, 
  end: { x: 200, y: 200 } 
});

// Get the length of a line
const length = lineService.getLength(line);
```

## Geometry Utilities

The application includes several utility modules for working with shapes:

### Shape Creation

The `shapeCreation.ts` module provides functions for creating different types of shapes:

```typescript
// Create a circle
const circle = createCircle({ center: { x: 100, y: 100 }, radius: 50 });

// Create a rectangle
const rectangle = createRectangle({ 
  position: { x: 100, y: 100 }, 
  width: 200, 
  height: 100 
});
```

### Shape Operations

The `shapeOperations.ts` module provides functions for common shape operations:

```typescript
// Select a shape
const selectedShapes = selectShape(shapes, shape.id);

// Move a shape
const movedShape = moveShape(shape, 10, 20);
```

### Shape Updates

The `shapeUpdates.ts` module provides functions for updating shape properties:

```typescript
// Update a shape's properties
const updatedShape = updateShape(shape, { fill: 'red', stroke: 'black' });
```

### Measurements

The `measurements.ts` module provides functions for calculating shape measurements:

```typescript
// Calculate the area of a shape
const area = calculateArea(shape);

// Calculate the perimeter of a shape
const perimeter = calculatePerimeter(shape);
```

### Rotation

The `rotation.ts` module provides functions for rotating shapes:

```typescript
// Rotate a point around a center
const rotatedPoint = rotatePoint(point, center, angle);

// Rotate a shape
const rotatedShape = rotateShape(shape, angle);
```

## Common Operations

### Creating Shapes

To create a shape, use the appropriate service:

```typescript
const circleService = ShapeServiceFactory.getService('circle');
const circle = circleService.create({ center: { x: 100, y: 100 }, radius: 50 });
```

### Moving Shapes

To move a shape, use the `move` method of the appropriate service:

```typescript
const movedShape = shapeService.move(shape, dx, dy);
```

### Resizing Shapes

To resize a shape, use the `resize` method of the appropriate service:

```typescript
const resizedShape = shapeService.resize(shape, scale, anchor);
```

### Rotating Shapes

To rotate a shape, use the `rotate` method of the appropriate service:

```typescript
const rotatedShape = shapeService.rotate(shape, angle, center);
```

## Error Handling

The shape services and utilities include error handling for common issues:

- Invalid shape parameters (e.g., negative radius)
- Missing required properties
- Invalid operations (e.g., rotating a circle around an external point)

Errors are thrown with descriptive messages to help identify the issue.

Example:

```typescript
try {
  const circle = circleService.create({ center: { x: 100, y: 100 }, radius: -50 });
} catch (error) {
  console.error(error.message); // "Radius must be a positive number"
}
``` 