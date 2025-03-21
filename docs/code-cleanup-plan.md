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

## Approach

### Phase 1: Analysis and Assessment (Week 1)

1. **Test Coverage Analysis**
   - Run comprehensive test coverage report: `npm run test:coverage`
   - Identify files/components with < 30% coverage
   - Create prioritized list of files for review
   - Consider integration with Coveralls for visualization

2. **Static Code Analysis**
   - Implement ESLint rules for detecting unused code
     - Add `no-unused-vars`, `no-unreachable`, and `no-dead-code` rules
   - Run `npm run lint` with new rules and catalog findings
   - Use VSCode/Cursor extensions for real-time detection

3. **Dependency Graph Analysis**
   - Use tools like `madge` or `dependency-cruiser` to:
     - Identify orphaned modules
     - Map component dependencies
     - Find circular dependencies

4. **Manual Code Review**
   - Focus on files with low coverage or high complexity
   - Look for commented-out code blocks
   - Identify duplicate functionality
   - Leverage Cursor's AI capabilities to identify potentially problematic code patterns

5. **Feature Mapping**
   - Create a map of critical user flows and features
   - Identify which parts of the codebase support these features
   - Prioritize e2e test coverage for these areas

### Phase 2: Test Coverage Improvement (Week 2)

1. **E2E Test Implementation**
   - Create new Playwright e2e tests for critical features with low coverage
   - Focus on user-facing functionality that must be preserved
   - Test all major user flows to ensure functionality is captured
   - Run tests locally via `npm run e2e`

2. **Unit Test Expansion**
   - Add unit tests for core business logic
   - Focus on functionality that's critical but not easily tested through e2e tests
   - Ensure edge cases are covered
   - Use Jest snapshots where appropriate for UI components

3. **Test Quality Assurance**
   - Review existing tests for effectiveness and reliability
   - Eliminate flaky tests
   - Ensure tests are meaningful and not just testing implementation details

### Phase 3: Cleanup Implementation (Weeks 3-4)

1. **Establish Cleanup Criteria**
   - Code hasn't been executed in tests or actual usage
   - Commented-out code blocks
   - Duplicate functionality
   - Incomplete implementations (TODOs older than 2 months)
   - Experimental code paths never integrated
   - **Safety check**: Code is not related to critical features identified in Phase 1

2. **Implement Cleanup Process**
   - Create git branch for cleanup work: `cleanup/unused-code-removal`
   - Make atomic, focused commits following project commit guidelines
   - Document removed code in commit messages (for reference)
   - Run **both unit and e2e tests** after each significant change
   - Update test coverage after cleanup

3. **Developer Guidelines**
   - Create timeboxing guidelines for experimental code
   - Establish cleanup practices for aborted feature attempts 
   - Add git hooks for preventing WIP commits without flags
   - Document process in team knowledge base

### Phase 4: Prevention and Monitoring (Week 5+)

1. **Local Quality Gates**
   - Implement pre-commit hooks for code quality checks
   - Set up scripts to run test coverage locally before commits
   - Create commit message templates for cleanup actions

2. **Coveralls Integration**
   - Set up Coveralls for tracking coverage metrics
   - Establish coverage thresholds for different parts of the codebase
   - Make coverage reports accessible to all team members
   - Track coverage trends over time

3. **Editor Integration**
   - Leverage Cursor and VSCode plugins for:
     - Dead code detection
     - Unused imports highlighting
     - Code quality metrics
   - Create shared editor configurations for the team

4. **Process Improvements**
   - Add code review checklist items focused on unused code
   - Schedule regular cleanup sprints (monthly)
   - Create "code janitor" role rotation
   - Require e2e tests for all new features

## Tools and Implementation

1. **Coverage Analysis**
   - Jest + Istanbul for coverage reports
   - Coveralls for coverage visualization and tracking
   - Custom script for identifying low-coverage areas

2. **E2E Testing**
   - Playwright for e2e tests
   - Visual regression testing
   - Performance testing for critical flows

3. **Static Analysis**
   - ESLint with custom rules for unused code
   - `ts-prune` for finding unused exports
   - Cursor/VSCode extensions for real-time feedback

4. **Dependency Analysis**
   - `madge` for dependency graphing
   - Custom tooling for identifying orphaned modules

5. **Local Automation**
   - Husky for git hooks
   - Simple shell scripts for routine analysis tasks
   - Documentation of manual processes

## Success Metrics

1. Overall test coverage increased to minimum 70%
2. No files with < 30% coverage (except for specific exceptions)
3. Zero ESLint warnings for unused code
4. Reduced bundle size
5. Improved code maintainability scores
6. All critical features covered by e2e tests
7. No regressions in user functionality

## Next Steps

1. Present plan to team for feedback
2. Set up local analysis tools and scripts
3. Consider Coveralls integration
4. Create prioritized list of e2e tests to add
5. Create prioritized cleanup backlog
6. Schedule first cleanup session

## References

- [Jest Coverage Documentation](https://jestjs.io/docs/configuration#collectcoveragefrom-array)
- [ESLint Dead Code Plugin](https://github.com/eslint/eslint)
- [ts-prune Documentation](https://github.com/nadeesha/ts-prune)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Coveralls Documentation](https://docs.coveralls.io/)
- [GitHub Issue #10](https://github.com/mfittko/geo-playground/issues/10) 