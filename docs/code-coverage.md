# Code Coverage Guide

This document explains how to work with code coverage tools in this project.

## Quick Start

```bash
# Run all tests with coverage and analyze
npm run coverage:full

# View the analysis report
open tmp/coverage-analysis.md

# View the HTML coverage report
open coverage/merged/html/index.html
```

## Setup

The project uses the following tools for code coverage:

- **Jest** with Istanbul for unit test coverage (lcov format)
- **Playwright** with V8/c8 coverage for E2E tests (lcov format)
- **lcov-result-merger** for combining coverage reports
- **Coverage Analyzer** for identifying high-impact areas

### Required Dependencies

The following npm packages are required for coverage analysis:
- `nyc` - Istanbul command line interface
- `@istanbuljs/nyc-config-typescript` - TypeScript configuration for NYC
- `lcov-result-merger` - For merging lcov reports
- `c8` - V8 coverage tool for E2E tests
- `minimatch` - For file pattern matching

These are already included in the project's `package.json`.

Additionally, the `lcov` tools should be installed on your system for HTML report generation:
```bash
# macOS
brew install lcov

# Ubuntu/Debian
apt-get install lcov
```

## Running Tests with Coverage

### Unit Tests (Jest)

```bash
npm run test:coverage
```

This runs Jest with coverage collection enabled and outputs reports to the `coverage` directory.

### E2E Tests (Playwright)

```bash
# Run E2E tests with coverage collection
npm run e2e:coverage
```

E2E tests are configured to collect coverage automatically and generate reports in the `coverage-e2e` directory.

### Full Coverage

```bash
npm run coverage:full
```

This runs both Jest and Playwright tests, then merges the lcov reports for unified analysis.

## Analyzing Coverage

```bash
npm run coverage:analyze
```

The analyzer creates a markdown report in `tmp/coverage-analysis.md` with:

- Overall statistics
- High-impact areas that need test coverage
- Potentially unused code
- Recommended actions

## Coverage Directories

The following directories are used for coverage:

- `coverage/` - Jest unit test coverage
- `coverage-e2e/` - Playwright E2E test coverage
- `coverage/merged/` - Combined coverage from all test types
- `tmp/coverage-analysis.md` - Analysis report

## Troubleshooting

### lcov Merge Issues

If you encounter issues with merging lcov reports:

1. **Clean the output directories**:
   ```bash
   rm -rf coverage/* coverage-e2e/*
   ```

2. **Check lcov-result-merger is installed**:
   ```bash
   npm list lcov-result-merger
   ```

3. **Install lcov tools** (for HTML reports):
   ```bash
   # macOS
   brew install lcov
   
   # Ubuntu/Debian
   apt-get install lcov
   ```

4. **Manual merge**:
   ```bash
   # Merge lcov files manually
   npx lcov-result-merger "coverage/lcov.info,coverage-e2e/lcov.info" coverage/merged/lcov.info
   
   # Generate HTML report
   genhtml coverage/merged/lcov.info --output-directory coverage/merged/html
   ```

### Playwright Coverage Issues

If Playwright isn't collecting coverage properly:

1. **Check the global setup**:
   Verify `e2e/global-setup.ts` is setting up coverage correctly.

2. **Manually run c8 after tests**:
   ```bash
   NODE_V8_COVERAGE=coverage-e2e/.temp npm run e2e
   npx c8 report --reporter=lcov --reporter=json --report-dir=coverage-e2e
   ```

3. **Check c8 is installed**:
   ```bash
   npm list c8
   ```

## CI Integration

In CI workflows, add these steps:

```yaml
- name: Install Dependencies
  run: npm ci

- name: Install lcov tools
  run: apt-get update && apt-get install -y lcov

- name: Run Tests with Coverage
  run: npm run coverage:full

- name: Archive Coverage Reports
  uses: actions/upload-artifact@v3
  with:
    name: coverage-reports
    path: |
      coverage/merged/
      tmp/coverage-analysis.md
```

## Custom Coverage Thresholds

To set custom coverage thresholds for the analyzer:

```bash
npm run coverage:analyze -- --threshold=50
```

This will flag files with less than 50% coverage as needing attention. 