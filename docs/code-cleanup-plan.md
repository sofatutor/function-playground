# Code Cleanup Plan: Addressing Unused Code

> **Related Issue:** [#10 Code Cleanup Initiative: Addressing Unused and Experimental Code](https://github.com/mfittko/geo-playground/issues/10)

## Problem Statement

"Vibe coding" sessions have resulted in accumulated technical debt:
- Unused code fragments scattered throughout the codebase
- Unfinished implementations from trial-and-error loops
- Confusing code patterns that make it difficult for agents to understand the codebase
- Low code coverage in certain areas indicating potential waste

## Goals

1. Identify and remove unused code
2. Improve test coverage, especially through e2e tests for critical features
3. Establish automated processes to prevent future accumulation
4. Create a cleaner, more maintainable codebase

## Progress Tracking

- [x] Create cleanup plan document
- [x] Develop coverage analysis tool (`scripts/coverage-analyzer.js`)
- [x] Run initial coverage analysis
- [ ] Complete Phase 1: Analysis
- [ ] Complete Phase 2: Test Coverage
- [ ] Complete Phase 3: Cleanup
- [ ] Complete Phase 4: Prevention

## Current Coverage Analysis

**As of March 2025:**

- Total Files: 78
- Average Coverage: 33.39%
- Files Below Threshold (30%): 48
- Files With No Coverage: 35

### High-Impact Priority Areas

1. `/src/components/GeometryCanvas/index.tsx` - Coverage: 29.61%, 1665 lines
2. `/src/components/FormulaEditor.tsx` - Coverage: 0.00%, 560 lines
3. `/src/hooks/useShapeOperations.ts` - Coverage: 0.00%, 494 lines
4. `/src/components/GeometryCanvas/CanvasEventHandlers.ts` - Coverage: 22.83%, 589 lines
5. `/src/pages/Index.tsx` - Coverage: 0.00%, 443 lines

## Approach

### Phase 1: Analysis and Assessment (Week 1)

1. **Test Coverage Analysis**
   - [x] Create coverage analysis script (`scripts/coverage-analyzer.js`)
   - [x] Run comprehensive test coverage report: `npm run test:coverage`
   - [x] Identify files/components with < 30% coverage using `node scripts/coverage-analyzer.js`
   - [ ] Create prioritized list of files for review
     - [ ] Focus on the 5 high-impact files first
     - [ ] Examine 35 files with 0% coverage for potential removal
   - [ ] Consider integration with Coveralls for visualization

2. **Static Code Analysis**
   - [ ] Implement ESLint rules for detecting unused code
     - [ ] Add `no-unused-vars`, `no-unreachable`, and `no-dead-code` rules
   - [ ] Run `npm run lint` with new rules and catalog findings
   - [ ] Use VSCode/Cursor extensions for real-time detection

3. **Dependency Graph Analysis**
   - [ ] Use tools like `madge` or `dependency-cruiser` to:
     - [ ] Identify orphaned modules
     - [ ] Map component dependencies
     - [ ] Find circular dependencies

4. **Manual Code Review**
   - [ ] Focus on files with low coverage or high complexity
     - [ ] Begin with `/src/components/GeometryCanvas/index.tsx`
     - [ ] Review `/src/components/FormulaEditor.tsx`
     - [ ] Examine `/src/hooks/useShapeOperations.ts`
   - [ ] Look for commented-out code blocks
   - [ ] Identify duplicate functionality
   - [ ] Leverage Cursor's AI capabilities to identify potentially problematic code patterns

5. **Feature Mapping**
   - [ ] Create a map of critical user flows and features
   - [ ] Identify which parts of the codebase support these features
   - [ ] Prioritize e2e test coverage for these areas

### Phase 2: Test Coverage Improvement (Week 2)

1. **E2E Test Implementation**
   - [ ] Create new Playwright e2e tests for critical features with low coverage
     - [ ] Test formula creation and editing
     - [ ] Test shape creation and manipulation
     - [ ] Test canvas grid interactions
   - [ ] Focus on user-facing functionality that must be preserved
   - [ ] Test all major user flows to ensure functionality is captured
   - [ ] Run tests locally via `npm run e2e`

2. **Unit Test Expansion**
   - [ ] Add unit tests for core business logic
     - [ ] Test `/src/hooks/useShapeOperations.ts`
     - [ ] Test `/src/components/FormulaEditor.tsx` key functions
     - [ ] Test `/src/components/GeometryCanvas/CanvasEventHandlers.ts`
   - [ ] Focus on functionality that's critical but not easily tested through e2e tests
   - [ ] Ensure edge cases are covered
   - [ ] Use Jest snapshots where appropriate for UI components

3. **Test Quality Assurance**
   - [ ] Review existing tests for effectiveness and reliability
   - [ ] Eliminate flaky tests
   - [ ] Ensure tests are meaningful and not just testing implementation details

### Phase 3: Cleanup Implementation (Weeks 3-4)

1. **Establish Cleanup Criteria**
   - [ ] Define specific criteria for removing code:
     - [ ] Code hasn't been executed in tests or actual usage
     - [ ] Commented-out code blocks
     - [ ] Duplicate functionality
     - [ ] Incomplete implementations (TODOs older than 2 months)
     - [ ] Experimental code paths never integrated
     - [ ] **Safety check**: Code is not related to critical features identified in Phase 1

2. **Implement Cleanup Process**
   - [ ] Create git branch for cleanup work: `cleanup/unused-code-removal`
   - [ ] Make atomic, focused commits following project commit guidelines
   - [ ] Document removed code in commit messages (for reference)
   - [ ] Run **both unit and e2e tests** after each significant change
   - [ ] Update test coverage after cleanup

3. **Developer Guidelines**
   - [ ] Create timeboxing guidelines for experimental code
   - [ ] Establish cleanup practices for aborted feature attempts 
   - [ ] Add git hooks for preventing WIP commits without flags
   - [ ] Document process in team knowledge base

### Phase 4: Prevention and Monitoring (Week 5+)

1. **Local Quality Gates**
   - [ ] Implement pre-commit hooks for code quality checks
   - [ ] Set up scripts to run test coverage locally before commits
   - [ ] Create commit message templates for cleanup actions

2. **Coveralls Integration**
   - [ ] Set up Coveralls for tracking coverage metrics
   - [ ] Establish coverage thresholds for different parts of the codebase
   - [ ] Make coverage reports accessible to all team members
   - [ ] Track coverage trends over time

3. **Editor Integration**
   - [ ] Leverage Cursor and VSCode plugins for:
     - [ ] Dead code detection
     - [ ] Unused imports highlighting
     - [ ] Code quality metrics
   - [ ] Create shared editor configurations for the team

4. **Process Improvements**
   - [ ] Add code review checklist items focused on unused code
   - [ ] Schedule regular cleanup sprints (monthly)
   - [ ] Create "code janitor" role rotation
   - [ ] Require e2e tests for all new features

## Implementation Plan

### Initial Cleanup Sprint (Week 3)

Based on the coverage analysis, here's the prioritized cleanup tasks:

1. **Files to Consider for Removal or Merging**
   - [ ] `/src/components/FormulaPointInfoTest.tsx` - appears to be a test component in production code
   - [ ] `/src/__tests__/utils/test-chalk.ts` and `/src/__tests__/utils/test-helpers.ts` - unused test helpers
   - [ ] `/src/components/MeasurementPanel.tsx` vs `/src/components/MeasurementPanel/index.tsx` - potential duplication

2. **Files to Test First**
   - [ ] `/src/hooks/useShapeOperations.ts` - critical business logic with 0% coverage
   - [ ] `/src/components/FormulaEditor.tsx` - complex UI component with 0% coverage
   - [ ] `/src/components/GeometryCanvas/index.tsx` - main canvas component with low coverage

3. **Debug Code to Remove**
   - [ ] Clean up excessive `console.log` statements throughout the codebase
   - [ ] Remove commented-out code that's been superseded
   - [ ] Fix warnings in components like `FormulaGraph.test.tsx` (unrecognized HTML tags)

## Tools and Implementation

1. **Coverage Analysis**
   - [x] Custom coverage analyzer script (`scripts/coverage-analyzer.js`)
   - [ ] Jest + Istanbul for coverage reports
   - [ ] Coveralls for coverage visualization and tracking

2. **E2E Testing**
   - [ ] Playwright for e2e tests
   - [ ] Visual regression testing
   - [ ] Performance testing for critical flows

3. **Static Analysis**
   - [ ] ESLint with custom rules for unused code
   - [ ] `ts-prune` for finding unused exports
   - [ ] Cursor/VSCode extensions for real-time feedback

4. **Dependency Analysis**
   - [ ] `madge` for dependency graphing
   - [ ] Custom tooling for identifying orphaned modules

5. **Local Automation**
   - [ ] Husky for git hooks
   - [ ] Simple shell scripts for routine analysis tasks
   - [ ] Documentation of manual processes

## Success Metrics

1. [ ] Overall test coverage increased to minimum 70%
2. [ ] No files with < 30% coverage (except for specific exceptions)
3. [ ] Zero ESLint warnings for unused code
4. [ ] Reduced bundle size
5. [ ] Improved code maintainability scores
6. [ ] All critical features covered by e2e tests
7. [ ] No regressions in user functionality

## Next Steps

1. [ ] Present plan to team for feedback
2. [x] Set up local analysis tools and scripts (coverage-analyzer.js)
3. [x] Run initial coverage analysis using `node scripts/coverage-analyzer.js`
4. [ ] Add ESLint rules for detecting unused code
5. [ ] Create prioritized list of e2e tests to add based on analysis results
6. [ ] Create prioritized cleanup backlog based on analysis results
7. [ ] Begin writing tests for high-impact files
8. [ ] Schedule first cleanup session

## Using the Coverage Analyzer

We've already implemented a custom coverage analyzer tool at `scripts/coverage-analyzer.js`. To use it:

```bash
# Run with default settings (30% threshold)
node scripts/coverage-analyzer.js

# Run with a custom threshold
node scripts/coverage-analyzer.js --threshold=40

# Run tests before analysis
node scripts/coverage-analyzer.js --run-tests

# Output in markdown format
node scripts/coverage-analyzer.js --format=markdown --output=docs/coverage-report.md
```

The tool will:
- Analyze existing coverage data
- Identify files with low or no coverage
- Calculate impact metrics
- Provide prioritized lists of files to focus on
- Generate reports in various formats

## References

- [Jest Coverage Documentation](https://jestjs.io/docs/configuration#collectcoveragefrom-array)
- [ESLint Dead Code Plugin](https://github.com/eslint/eslint)
- [ts-prune Documentation](https://github.com/nadeesha/ts-prune)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Coveralls Documentation](https://docs.coveralls.io/)
- [GitHub Issue #10](https://github.com/mfittko/geo-playground/issues/10) 