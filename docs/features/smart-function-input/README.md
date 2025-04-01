# Smart Function Input Feature

## Overview

The Smart Function Input feature enhances the function plotting capabilities by providing an intuitive interface for entering mathematical functions with automatic parameter detection. This allows users to easily create and manipulate mathematical functions with parameters.

## User Stories

### Intuitive Function Input
- As a user, I want to input mathematical functions in a natural way (e.g., "f(x) = ax^2 + bx + c")
- As a user, I want to use standard mathematical notation for functions (e.g., "f(x)", "y =", etc.)
- As a user, I want to easily input exponents using the ^ symbol or superscript
- As a user, I want to input common mathematical functions (sin, cos, sqrt, etc.)
- As a user, I want to see my input formatted in proper mathematical notation

### Mathematical Input Interface
- As a user, I want to have a GeoGebra-like interface with buttons for mathematical symbols and functions
- As a user, I want to easily insert mathematical operators (+, -, ×, ÷, ^, √, etc.)
- As a user, I want to have quick access to common mathematical functions (sin, cos, tan, log, etc.)
- As a user, I want to be able to both click buttons and type directly into the input field
- As a user, I want the cursor position to be maintained when inserting symbols
- As a user, I want to have the input organized in tabs (Basic, Functions, Operators) for better organization

### Parameter Detection
- As a user, I want the system to automatically detect parameters in my function (e.g., a, b, c in ax^2 + bx + c)
- As a user, I want to see a list of detected parameters with their current values
- As a user, I want to be able to adjust parameter values using interactive controls
- As a user, I want to see the graph update in real-time as I adjust parameters

### Input Assistance
- As a user, I want to see suggestions for common mathematical functions as I type
- As a user, I want to see examples of how to input different types of functions
- As a user, I want to be able to use keyboard shortcuts for common mathematical operations
- As a user, I want to see immediate feedback if my input is invalid

## Implementation Plan

## Overview
This document outlines the implementation plan for enhancing the function input capabilities in the geometry playground. The goal is to make function input more intuitive and user-friendly while maintaining compatibility with the existing formula system.

## Implementation Phases

### Phase 0: Layout Restructuring
1. Move function controls to a dedicated sidebar
   - [x] Create a new sidebar component for function controls
   - [x] Position the sidebar next to the canvas
   - [x] Move formula editor and controls from overlay to sidebar
   - [x] Adjust canvas width to accommodate sidebar
   - [x] Ensure responsive behavior for different screen sizes
   - [x] Update layout to maintain proper spacing and alignment

2. Update component hierarchy
   - [x] Modify GeometryCanvas to accept sidebar as a prop
   - [x] Update Index component to handle new layout structure
   - [x] Ensure proper state management between components
   - [x] Maintain existing functionality during transition

3. Style and UI improvements
   - [x] Design consistent sidebar styling
   - [x] Add smooth transitions for sidebar open/close
   - [x] Ensure proper z-indexing for all components
   - [x] Add responsive breakpoints for mobile views

### Phase 1: Parameter Detection and Dynamic Controls
1. Parameter Detection
   - [ ] Create parameter detection utility
   - [ ] Implement regex-based parameter extraction
   - [ ] Filter out mathematical function names (sqrt, sin, cos, etc.)
   - [ ] Handle nested functions and complex expressions
   - [ ] Add tests for parameter detection
   - [ ] Set default value of 1 for all detected parameters

2. Dynamic Slider Creation
   - [ ] Create reusable slider component
   - [ ] Implement dynamic slider generation based on parameters
   - [ ] Add proper styling and layout for sliders
   - [ ] Ensure accessibility of dynamic controls
   - [ ] Add tests for slider component and generation

3. Live Formula Updates
   - [ ] Implement parameter value state management
   - [ ] Create formula evaluation with parameter substitution
   - [ ] Add real-time graph updates when parameters change
   - [ ] Optimize performance for frequent updates
   - [ ] Add tests for live updates

### Success Criteria
1. Parameter Detection
   - Correctly identifies parameters in formulas
   - Ignores mathematical function names
   - Handles complex expressions
   - Sets appropriate default values

2. Dynamic Controls
   - Sliders appear automatically for detected parameters
   - Controls are properly styled and accessible
   - Sliders have appropriate ranges and step sizes
   - UI remains responsive with many parameters

3. Live Updates
   - Graph updates immediately when parameters change
   - Performance remains smooth with multiple formulas
   - No visual glitches during updates
   - All changes are properly persisted

### Technical Considerations
1. Parameter Detection
   - Use regex for initial parameter extraction
   - Maintain list of mathematical function names to filter
   - Consider using a proper math expression parser
   - Handle edge cases (e.g., parameters in nested functions)

2. Dynamic Controls
   - Use Shadcn UI components for consistency
   - Implement proper state management
   - Consider mobile responsiveness
   - Handle many parameters gracefully

3. Performance
   - Debounce parameter updates
   - Optimize formula evaluation
   - Consider using Web Workers for heavy computations
   - Implement proper cleanup and memory management

## Technical Considerations

### State Management
- Use React Context for global state
- Implement proper state synchronization
- Handle formula updates efficiently
- Maintain undo/redo functionality

### Performance
- Implement efficient formula evaluation
- Use Web Workers for heavy calculations
- Optimize rendering for large datasets
- Implement proper memoization

### Accessibility
- Ensure keyboard navigation
- Add screen reader support
- Implement proper ARIA labels
- Support high contrast mode

### Testing
- Add comprehensive unit tests
- Implement integration tests
- Add performance benchmarks
- Test edge cases and error conditions

## Timeline
- Phase 0: 1-2 weeks
- Phase 1: 2-3 weeks
- Phase 2: 2-3 weeks
- Phase 3: 1-2 weeks

Total estimated time: 6-10 weeks

## Success Criteria
1. Users can input functions using standard mathematical notation
2. Functions are displayed accurately on the canvas
3. Multiple functions can be displayed simultaneously
4. Performance remains smooth with complex functions
5. The interface is intuitive and user-friendly
6. All features work responsively on different screen sizes
7. The system maintains compatibility with existing geometry features

## Technical Details

### Function Input
The system will support:
- Natural language input (e.g., "f(x) = ax^2 + bx + c")
- Standard mathematical notation
- Exponents using ^ or superscript
- Common mathematical functions (sin, cos, sqrt, etc.)
- Real-time formatting and validation

### Parameter Detection
The system will identify parameters as:
- Single letters (a, b, c, etc.)
- Greek letters (α, β, γ, etc.)
- Custom parameter names (enclosed in curly braces)

### Data Structures

```typescript
// Parameter type for function parameters
interface Parameter {
  name: string;
  value: number;
  min: number;
  max: number;
  step: number;
}

// Updated Formula type
interface Formula {
  id: string;
  name: string;
  expression: string;
  substitutedExpression?: string;
  parameters?: Parameter[];
  domain: [number, number];
  color: string;
  visible: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## Testing Plan

### Unit Tests
- [ ] Function input parsing tests
- [ ] Parameter detection tests
- [ ] Input validation tests
- [ ] Formula evaluation tests with parameters

### Integration Tests
- [ ] Input component integration tests
- [ ] Parameter UI integration tests
- [ ] Real-time update tests

### E2E Tests
- [ ] Complete function input workflow
- [ ] Parameter adjustment workflow
- [ ] Real-time graph update workflow

## Migration Plan

1. Add new fields to existing formulas
   - [ ] Add parameters array (empty by default)
   - [ ] Add substitutedExpression field

2. Update formula validation
   - [ ] Add parameter validation
   - [ ] Add natural language input validation

3. Update UI components
   - [ ] Add enhanced formula input
   - [ ] Add parameter controls
   - [ ] Add input assistance features 