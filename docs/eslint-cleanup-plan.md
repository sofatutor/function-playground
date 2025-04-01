# ESLint Warning Cleanup Plan

## Overview

We have 196 ESLint warnings to address, covering unused code, React hook dependencies, and code quality issues.

## Categories of Warnings

1. **Unused Imports and Variables (140+ warnings)**
2. **React Hook Dependencies (15+ warnings)**
3. **Component Structure Warnings (10+ warnings)**
4. **Empty Functions and Other Issues (30+ warnings)**

## Approach

1. **Assessment**: Group warnings by file and type
2. **Fix Strategy**:
   - **Remove**: Delete genuinely unused code (preferred approach)
   - **Keep with comment**: Only if there's a compelling reason with clear documentation
   - **Fix**: Correct actual issues like missing hook dependencies
   - **Suppress**: Only for rare false positives

3. **Order**: High-impact files → Core logic → UI components → Tests

## Priority Files

Based on our ESLint output, these files need immediate attention:

- [x] `/src/hooks/useShapeOperations.ts` - 8 warnings, critical business logic
- [x] `/src/components/GeometryCanvas/index.tsx` - 12 warnings, core component
- [x] `/src/components/FormulaEditor.tsx` - 10 warnings, complex UI component 
- [x] `/src/utils/geometry/measurements.ts` - 11 warnings, utility functions
- [x] `/src/utils/geometry/shapeOperations.ts` - 7 warnings, core shape logic

## Implementation Plan

### Phase 1: Core Logic Files (Days 1-2)

- [x] Fix `/src/hooks/useShapeOperations.ts`
- [x] Fix `/src/utils/geometry/measurements.ts`
- [x] Fix `/src/utils/geometry/shapeOperations.ts`
- [x] Fix `/src/utils/geometry/shapeUpdates.ts`

### Phase 2: Component Files (Days 3-4)

- [x] Fix `/src/components/GeometryCanvas/index.tsx`
- [x] Fix `/src/components/FormulaEditor.tsx`
- [x] Fix `/src/components/FormulaGraph.tsx`

### Phase 3: Supporting Files (Days 5-6)

- [x] Address service implementations
- [ ] Fix remaining component files
- [ ] Fix context providers

### Phase 4: Test Files (Day 7)

- [ ] Clean up test files

## Guidelines for Fixes

1. **For Unused Imports/Variables:**
   - **ALWAYS PREFER REMOVAL** of unused code
   - **NEVER prefix unused functions with underscores** or repurpose them for other uses
   - If a function parameter is unused in the implementation but required by an interface, use `_` prefix for that parameter only
   - If code might be needed soon (with concrete plan), add a TODO comment with explanation

2. **For Hook Dependencies:**
   - Add missing dependencies to dependency arrays
   - Restructure code if adding a dependency would cause infinite loops
   - Use `useCallback`/`useMemo` appropriately

3. **For Component Exports:**
   - Follow React component structure best practices

## Testing Strategy

After each set of changes:
- [ ] Run lint check: `npm run lint`
- [ ] Run unit tests: `npm run test`
- [ ] Run e2e tests: `npm run e2e`
- [ ] Verify application functionality manually

## Commit Strategy

Commit changes in small, logical groups with descriptive messages:
- `fix(lint): remove unused [type of code] in [filename]`
- `fix(lint): correct hook dependencies in [component]`
- `refactor: extract constants from [component] for proper refresh`

## Progress

### Completed Files
- [x] `/src/hooks/useShapeOperations.ts` - Fixed unused variables, imports, and hook dependencies 
- [x] `/src/utils/geometry/measurements.ts` - Removed unused imports and variables
- [x] `/src/utils/geometry/shapeUpdates.ts` - Removed unused imports, code and refactored functions 
- [x] `/src/utils/geometry/shapeOperations.ts` - Removed unused imports and prefixed unused parameters
- [x] `/src/components/GeometryCanvas/index.tsx` - Marked unused variables, reduced excessive console logging, and added e2e test
- [x] `/src/components/FormulaEditor.tsx` - Removed unused imports, marked unused parameters, and removed unused functions
- [x] `/src/components/FormulaGraph.tsx` - Marked unused variables, fixed hook dependencies, and wrapped functions in useCallback
- [x] `/src/services/implementations/*.ts` - Prefixed unused parameters with underscores and removed unused imports
- [x] `/src/App.tsx` - Removed all unused code and imports
- [x] `/src/components/ui/command.tsx` - Fixed empty interface issue
- [x] `/src/components/ui/textarea.tsx` - Fixed empty interface issue
- [x] `/src/i18n/useTranslation.ts` - Replaced any type with proper typing
- [x] `/tailwind.config.ts` - Fixed require import with proper ES module import

### Current Status
As of our latest run, we have:
- 143 remaining problems (15 errors, 128 warnings)
- Most errors are in generated coverage files (can be ignored in ESLint config)
- Most warnings are unused variables needing `_` prefix

### Next Priority Files

1. **High-Impact Component Files:**
   - [ ] `/src/components/FormulaPointInfo.tsx` - 5 warnings 
   - [ ] `/src/components/Toolbar.tsx` - 7 warnings
   - [ ] `/src/components/GeometryCanvas/CanvasEventHandlers.ts` - 4 warnings
   - [ ] `/src/components/UnifiedInfoPanel.tsx` - 4 warnings

2. **React Hook Dependencies:**
   - [ ] `/src/components/GeometryCanvas/index.tsx` - 5 hook warnings
   - [ ] `/src/pages/Index.tsx` - 1 hook warning

3. **Test Files:**
   - [ ] E2E test files 
   - [ ] Unit test files

### Approach for Completing the Cleanup

1. **For Component Files:**
   - Focus on the 4 high-impact components first
   - Address unused variables and hook dependencies together
   - Run tests after each component fix
   
2. **For Test Files:**
   - Group test files by related functionality
   - Fix unit tests before e2e tests
   - Ensure tests still pass after fixes

3. **For Coverage Files:**
   - Add appropriate exclusions to ESLint config to ignore generated files

4. **Final Verification:**
   - Complete full lint, unit test, and e2e test run
   - Address any remaining issues