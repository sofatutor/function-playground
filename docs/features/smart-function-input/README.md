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

### Phase 1: Enhanced Function Input
1. Create enhanced formula input component
   - [ ] Implement natural language function input
   - [ ] Add support for standard mathematical notation
   - [ ] Add support for exponents and superscripts
   - [ ] Add support for common mathematical functions
   - [ ] Implement real-time formatting

2. Add input assistance features
   - [ ] Implement function suggestions
   - [ ] Add example templates
   - [ ] Add keyboard shortcuts
   - [ ] Add input validation feedback

### Phase 2: Parameter Detection
1. Create parameter detection utility
   - [ ] Implement regex-based parameter detection
   - [ ] Add support for common mathematical functions
   - [ ] Handle nested functions and complex expressions
   - [ ] Add validation for detected parameters

2. Update Formula type and context
   - [ ] Add parameters field to Formula type
   - [ ] Update formula validation
   - [ ] Add parameter persistence

3. Create parameter control UI
   - [ ] Design parameter control panel
   - [ ] Implement parameter sliders
   - [ ] Add real-time updates

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