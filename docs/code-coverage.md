# Code Coverage Guide

This document explains how to work with code coverage tools in this project.

## Quick Start

```bash
# Run unit tests with coverage
npm run test:coverage

# Run E2E tests with coverage
npm run e2e:coverage

# View the HTML coverage report for unit tests
open coverage/lcov-report/index.html

# View the HTML coverage report for E2E tests
open coverage/e2e/html/index.html
```

## Setup

The project uses the following tools for code coverage:

- **Jest** with Istanbul for unit test coverage (lcov format)
- **Playwright** with V8/c8 coverage for E2E tests (lcov format)

### Required Dependencies

The following npm packages are required for coverage analysis:
- `nyc` - Istanbul command line interface
- `@istanbuljs/nyc-config-typescript` - TypeScript configuration for NYC
- `c8` - V8 coverage tool for E2E tests

These are already included in the project's `package.json`.

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

E2E tests are configured to collect coverage automatically and generate reports in the `coverage/e2e` directory.

## Coverage Directories

The following directories are used for coverage:

- `coverage/` - Jest unit test coverage
- `coverage/e2e/` - Playwright E2E test coverage

## Troubleshooting

### Playwright Coverage Issues

If Playwright isn't collecting coverage properly:

1. **Check the global setup**:
   Verify `e2e/global-setup.ts` is setting up coverage correctly.

2. **Manually run coverage reporting after tests**:
   ```bash
   VITE_ENABLE_COVERAGE=true npm run e2e:ci
   npx nyc report --reporter=lcov --reporter=json --reporter=html --reporter=text --temp-dir=./coverage/e2e/tmp --report-dir=./coverage/e2e
   ```

3. **Check nyc and c8 are installed**:
   ```bash
   npm list nyc c8
   ```

## CI Integration

In CI workflows, add these steps:

```yaml
- name: Install Dependencies
  run: npm ci

- name: Run Unit Tests with Coverage
  run: npm run test:coverage

- name: Run E2E Tests with Coverage
  run: npm run e2e:coverage

- name: Archive Coverage Reports
  uses: actions/upload-artifact@v3
  with:
    name: coverage-reports
    path: coverage/
``` 