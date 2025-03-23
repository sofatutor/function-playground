# ESLint Warning Cleanup Plan

## Overview

We've identified 196 warnings from ESLint that need to be addressed. These warnings help us identify unused code that can be removed, potential bugs in React hook dependencies, and general code quality issues.

## Categories of Warnings

1. **Unused Imports and Variables (140+ warnings)**
   - Many imports and variables are defined but never used
   - These need careful review to determine if they're truly unused

2. **React Hook Dependencies (15+ warnings)**
   - Missing dependencies in `useEffect`, `useCallback`, etc.
   - These can lead to subtle bugs and need proper fixing

3. **Component Structure Warnings (10+ warnings)**
   - Fast refresh related warnings about exporting components
   - Mainly affecting UI component structure

4. **Empty Functions and Other Patterns (30+ warnings)**
   - Empty functions, unreachable code, warnings in comments
   - Various other minor issues

## Approach

We'll take a systematic approach to addressing these warnings:

1. **Initial Assessment**
   - Group warnings by file and type
   - Identify high-impact files with many warnings
   - Prioritize critical components and hooks

2. **Fix Categorization**
   - **Remove**: Code that is genuinely unused and safe to delete
   - **Keep with prefix**: Add `_` prefix to variables that are intentionally unused, for example in method signatures.
   - **Fix**: Correct actual issues like missing hook dependencies
   - **Suppress**: Only in rare cases where warnings are false positives

3. **Implementation Order**
   - First: High-impact files with many warnings
   - Second: Core business logic files
   - Third: UI component files
   - Last: Test files

## Priority Files

Based on our ESLint output, these files need immediate attention:

- [x] `/src/hooks/useShapeOperations.ts` - 8 warnings, critical business logic
- [ ] `/src/components/GeometryCanvas/index.tsx` - 12 warnings, core component
- [ ] `/src/components/FormulaEditor.tsx` - 10 warnings, complex UI component 
- [x] `/src/utils/geometry/measurements.ts` - 11 warnings, utility functions
- [x] `/src/utils/geometry/shapeOperations.ts` - 7 warnings, core shape logic

## Implementation Plan

### Phase 1: Core Logic Files (Days 1-2)

- [x] Fix `/src/hooks/useShapeOperations.ts`
  - [x] Remove unused imports
  - [x] Prefix unused variables with underscore
  - [x] Fix hook dependencies
  - [x] Create/update tests for the file
- [x] Fix `/src/utils/geometry/measurements.ts`
  - [x] Remove unused imports
  - [x] Prefix unused variables with underscore
  - [x] Ensure functions have proper tests
- [x] Fix `/src/utils/geometry/shapeOperations.ts`
  - [x] Remove unused imports
  - [x] Prefix unused variables with underscore
  - [x] Verify tests pass
- [x] Fix `/src/utils/geometry/shapeUpdates.ts`
  - [x] Remove unused imports
  - [x] Remove unused code (MeasurementUpdateHandler type, unused functions)
  - [x] Refactor code to eliminate unnecessary variables

### Phase 2: Component Files (Days 3-4)

- [ ] Fix `/src/components/GeometryCanvas/index.tsx`
  - [ ] Remove unused imports
  - [ ] Fix hook dependencies
  - [ ] Address component structure issues
- [ ] Fix `/src/components/FormulaEditor.tsx`
  - [ ] Remove unused imports
  - [ ] Prefix unused variables with underscore
  - [ ] Fix hook dependencies
- [ ] Fix `/src/components/FormulaGraph.tsx`
  - [ ] Remove unused imports
  - [ ] Fix hook dependencies
  - [ ] Ensure component structure is correct

### Phase 3: Supporting Files (Days 5-6)

- [ ] Address service implementations
  - [ ] Fix unused imports and variables
  - [ ] Update test coverage as needed
- [ ] Fix remaining component files
  - [ ] Address component structure warnings
  - [ ] Fix unused imports and variables
- [ ] Fix context providers
  - [ ] Address fast refresh warnings
  - [ ] Fix hook dependencies

### Phase 4: Test Files (Day 7)

- [ ] Clean up test files
  - [ ] Fix test utilities
  - [ ] Address test-specific warnings

## Guidelines for Fixes

When fixing warnings, follow these principles:

1. **For Unused Imports/Variables:**
   - Consider if the code is truly unused and can be removed
   - If it's required for type checking but not used, prefix with `_`
   - If it might be used in the future, add a comment explaining why or remove it

2. **For Hook Dependencies:**
   - Add missing dependencies to dependency arrays
   - If adding a dependency would cause an infinite loop, consider restructuring
   - Use `useCallback`/`useMemo` to prevent unnecessary recreations of functions/objects

3. **For Component Exports:**
   - Split constant declarations and component exports when needed
   - Follow React best practices for component structure

## Testing Strategy

After each significant set of changes:
- [ ] Run the lint check: `npm run lint`
- [ ] Run unit tests: `npm run test`
- [ ] Run e2e tests: `npm run e2e`
- [ ] Verify application functionality manually

## Commit Strategy

1. Commit changes file by file or by small related groups
2. Use descriptive commit messages following the format:
   - `fix(lint): remove unused imports in [filename]`
   - `fix(lint): correct hook dependencies in [component]`
   - `refactor: extract constants from [component] for proper refresh`

This systematic approach will help us address the ESLint warnings methodically while ensuring we don't break existing functionality.

## Progress

### Completed Files
- [x] `/src/hooks/useShapeOperations.ts` - Fixed unused variables, imports, and hook dependencies 
- [x] `/src/utils/geometry/measurements.ts` - Removed unused imports and variables
- [x] `/src/utils/geometry/shapeUpdates.ts` - Removed unused imports, code and refactored functions 
- [x] `/src/utils/geometry/shapeOperations.ts` - Removed unused imports and prefixed unused parameters 