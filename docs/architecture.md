# Geo-Playground Architecture Documentation

## Overview

This document provides a comprehensive overview of the Geo-Playground application architecture, explaining the design decisions, component relationships, and data flow.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Component Structure](#component-structure)
3. [Data Flow](#data-flow)
4. [State Management](#state-management)
5. [Service Layer](#service-layer)
6. [Extension Points](#extension-points)

## System Architecture

Geo-Playground follows a component-based architecture with a service layer for business logic. The application is built using React and TypeScript, with a focus on maintainability, testability, and extensibility.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Components                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │    Header   │  │  Sidebar    │  │  GeometryCanvas     │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                          Hooks                              │
│  ┌─────────────────────┐  ┌───────────────────────────────┐ │
│  │  useShapeOperations │  │  useCanvasInteractions        │ │
│  └─────────────────────┘  └───────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                        Services                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │CircleService│  │RectangleServ│  │TriangleServ │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│  ┌─────────────┐  ┌─────────────────────────────┐           │
│  │ LineService │  │   ShapeServiceFactory       │           │
│  └─────────────┘  └─────────────────────────────┘           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                      Utilities                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │shapeCreation│  │shapeOperatio│  │shapeUpdates │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │measurements │  │  rotation   │  │    common   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

## Component Structure

The application is organized into the following main components:

### App Component

The `App` component is the entry point of the application. It sets up the routing and providers.

### GeometryCanvas Component

The `GeometryCanvas` component is responsible for rendering the canvas and handling user interactions. It uses the canvas API to draw shapes and handle events like mouse clicks and drags.

### Toolbar Component

The `Toolbar` component provides tools for creating and manipulating shapes. It includes buttons for selecting different shape types and operations.

### Properties Panel Component

The `PropertiesPanel` component displays and allows editing of the properties of the selected shape(s).

### Component Hierarchy

```
App
├── Header
├── Toolbar
├── GeometryCanvas
│   ├── ShapeRenderer
│   ├── GridRenderer
│   └── SelectionHandler
└── PropertiesPanel
    ├── ShapeProperties
    ├── StyleProperties
    └── MeasurementDisplay
```

## Data Flow

The application follows a unidirectional data flow pattern:

1. User interactions (e.g., mouse clicks, drags) are captured by the `GeometryCanvas` component
2. These events are processed by the appropriate event handlers
3. The event handlers use the shape services to perform operations on shapes
4. The updated shapes are stored in the application state
5. The state changes trigger re-renders of the components
6. The components display the updated shapes

### Data Flow Diagram

```
┌──────────────┐     ┌───────────────┐     ┌─────────────┐
│User Interaction│────▶│Event Handlers │────▶│Shape Services│
└──────────────┘     └───────────────┘     └─────────────┘
                                                  │
┌──────────────┐     ┌───────────────┐     ┌─────▼─────┐
│  Components  │◀────│   Rendering   │◀────│Application │
│              │     │               │     │   State    │
└──────────────┘     └───────────────┘     └───────────┘
```

## State Management

The application uses React's Context API and custom hooks for state management.

### Shape State

The shape state is managed by the `useShapeOperations` hook, which provides functions for creating, selecting, moving, resizing, and rotating shapes.

```typescript
const {
  shapes,
  selectedShapes,
  createShape,
  selectShape,
  moveShape,
  resizeShape,
  rotateShape,
} = useShapeOperations();
```

### Canvas State

The canvas state (e.g., zoom level, pan position) is managed by the `useCanvasState` hook.

```typescript
const {
  zoom,
  panOffset,
  setZoom,
  setPanOffset,
} = useCanvasState();
```

### Interaction State

The interaction state (e.g., current tool, drag state) is managed by the `useInteractionState` hook.

```typescript
const {
  currentTool,
  isDragging,
  dragStart,
  setCurrentTool,
  setIsDragging,
  setDragStart,
} = useInteractionState();
```

## Service Layer

The service layer provides a clean separation between the UI components and the business logic. Each shape type has its own service implementation that extends the base `ShapeService` interface.

### Service Interfaces

The `ShapeService` interface defines the common operations that can be performed on shapes:

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

### Service Factory

The `ShapeServiceFactory` provides a way to get the appropriate service for a given shape type:

```typescript
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
      default:
        throw new Error(`Unsupported shape type: ${type}`);
    }
  }
}
```

### Dependency Injection

The application uses a simple form of dependency injection, where services are created by the factory and injected into the components that need them.

## Extension Points

The application is designed to be extensible. Here are the main extension points:

### Adding New Shape Types

To add a new shape type:

1. Define the shape interface in `types/shapes.ts`
2. Create a new service implementation in `services/implementations`
3. Update the `ShapeServiceFactory` to return the new service
4. Add shape creation functions in `utils/geometry/shapeCreation.ts`
5. Add shape rendering logic in the `ShapeRenderer` component

### Adding New Operations

To add a new operation:

1. Add the operation to the `ShapeService` interface
2. Implement the operation in each shape service
3. Add utility functions in the appropriate utility module
4. Add UI controls in the appropriate component

### Adding New Tools

To add a new tool:

1. Add the tool to the `ToolType` enum
2. Add the tool button to the `Toolbar` component
3. Add the tool logic to the appropriate event handlers

## Glossary

- **Shape**: A geometric object that can be drawn on the canvas
- **Point**: A 2D coordinate with x and y values
- **Service**: A class that provides operations for a specific shape type
- **Factory**: A class that creates instances of services
- **Hook**: A React function that provides state and behavior
- **Component**: A React UI element
- **Canvas**: The HTML element where shapes are drawn
- **Tool**: A user interface element that allows performing operations on shapes 