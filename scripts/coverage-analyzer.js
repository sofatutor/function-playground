#!/usr/bin/env node

/**
 * Coverage Analyzer Script
 * 
 * Analyzes existing coverage reports to identify:
 * 1. Files with low coverage
 * 2. Potentially unused files/components
 * 3. Areas requiring immediate attention
 * 
 * Usage: 
 * 1. Ensure coverage data exists in ./coverage (e.g., run `npm run test:coverage` or `npm run e2e:coverage`)
 * 2. Run this script: node scripts/coverage-analyzer.js
 * 
 * Options:
 * --threshold=40    Set coverage threshold (default: 30)
 * --format=TYPE     Output format: text (console, default), markdown, json
 * --output=PATH     Custom output file path (for markdown/json)
 * --run-tests       Run `npm run test:coverage` before analysis
 * --run-e2e         Run `npm run e2e:coverage` before analysis
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Enable strict failure mode
process.on('uncaughtException', (error) => {
  console.error('\x1b[31mFatal error:', error.message, '\x1b[0m');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('\x1b[31mUnhandled promise rejection:', reason, '\x1b[0m');
  process.exit(1);
});

// Get current filename and directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const params = {
  threshold: 30,
  format: 'text', // Default to console output
  output: null,
  runTests: false,
  runE2E: false,
  help: false
};

// Configuration
const COVERAGE_DIR = path.join(process.cwd(), 'coverage');
const COVERAGE_THRESHOLD = params.threshold;
const OUTPUT_FILE = params.output || path.join(process.cwd(), 'tmp', 'coverage-report.' + (params.format === 'json' ? 'json' : 'md'));

// Colors for console output
const colors = {
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

// Process command line arguments
args.forEach(arg => {
  if (arg.startsWith('--threshold=')) params.threshold = parseInt(arg.split('=')[1], 10);
  else if (arg.startsWith('--format=')) params.format = arg.split('=')[1];
  else if (arg.startsWith('--output=')) params.output = arg.split('=')[1];
  else if (arg === '--run-tests') params.runTests = true;
  else if (arg === '--run-e2e') params.runE2E = true;
  else if (arg === '--help' || arg === '-h') params.help = true;
});

/**
 * Main function to run the coverage analysis
 */
async function analyzeCoverage() {
  if (params.help) {
    showHelp();
    process.exit(0);
  }

  console.log(`${colors.cyan}Analyzing coverage data...${colors.reset}`);

  try {
    // Run tests if requested
    if (params.runTests) {
      console.log(`\n${colors.blue}Running npm run test:coverage${colors.reset}\n`);
      safeExecSync('npm run test:coverage');
    }
    if (params.runE2E) {
      console.log(`\n${colors.blue}Running npm run e2e:coverage${colors.reset}\n`);
      safeExecSync('npm run e2e:coverage');
    }

    // Read coverage data
    const coverageJSON = path.join(COVERAGE_DIR, 'coverage-final.json');
    if (!fs.existsSync(coverageJSON)) {
      console.error(`${colors.red}Error: Coverage data not found at ${coverageJSON}. Run tests with coverage first.${colors.reset}`);
      process.exit(1);
    }

    let coverageData;
    try {
      const fileContent = fs.readFileSync(coverageJSON, 'utf8');
      if (!fileContent || fileContent.trim().length === 0) {
        console.error(`${colors.red}Error: Coverage file is empty.${colors.reset}`);
        process.exit(1);
      }
      coverageData = JSON.parse(fileContent);
      if (!coverageData || Object.keys(coverageData).length === 0) {
        console.error(`${colors.red}Error: Coverage data is empty or invalid.${colors.reset}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`${colors.red}Error parsing coverage data: ${error.message}${colors.reset}`);
      process.exit(1);
    }

    console.log(`${colors.green}Found coverage data for ${Object.keys(coverageData).length} files${colors.reset}`);

    // Process the coverage data
    const results = processCoverageData(coverageData);

    // Generate the report
    if (params.format === 'markdown') generateMarkdownReport(results);
    else if (params.format === 'json') generateJSONReport(results);
    else outputConsoleReport(results); // Default to text/console

    if (params.format !== 'text') {
      console.log(`${colors.green}Report saved to: ${OUTPUT_FILE}${colors.reset}`);
    }
    outputLLMFocusedSummary(results);
  } catch (error) {
    console.error(`${colors.red}Fatal error during analysis: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Process the coverage data to extract metrics
 */
function processCoverageData(coverageData) {
  const results = {
    lowCoverageFiles: [],
    unusedFiles: [],
    overallStats: {
      totalFiles: 0,
      averageCoverage: 0,
      filesBelowThreshold: 0,
      filesWithNoCoverage: 0
    },
    timestamp: new Date().toISOString()
  };

  let totalCoverage = 0;

  for (const filePath in coverageData) {
    const fileData = coverageData[filePath];
    const relativePath = filePath.replace(process.cwd(), '');

    if (!fileData || !fileData.statementMap) {
      console.warn(`${colors.yellow}Invalid coverage data for ${path.basename(filePath)}, skipping${colors.reset}`);
      continue;
    }

    const statementCoverage = calculateStatementCoverage(fileData);
    const functionCoverage = calculateFunctionCoverage(fileData);
    const branchCoverage = calculateBranchCoverage(fileData);

    totalCoverage += statementCoverage;
    results.overallStats.totalFiles++;

    if (statementCoverage < COVERAGE_THRESHOLD) {
      results.overallStats.filesBelowThreshold++;
      const fileInfo = {
        path: relativePath,
        statement: statementCoverage,
        function: functionCoverage,
        branch: branchCoverage
      };
      if (statementCoverage === 0) {
        results.overallStats.filesWithNoCoverage++;
        results.unusedFiles.push(fileInfo);
      } else {
        results.lowCoverageFiles.push(fileInfo);
      }
    }
  }

  results.overallStats.averageCoverage = results.overallStats.totalFiles ? totalCoverage / results.overallStats.totalFiles : 0;
  return results;
}

/**
 * Calculate statement coverage percentage for a file
 */
function calculateStatementCoverage(fileData) {
  if (!fileData?.statementMap || !fileData.s) return 0;
  const statementsTotal = Object.keys(fileData.statementMap).length;
  if (statementsTotal === 0) return 0;
  let coveredStatements = 0;
  for (const statId in fileData.s) {
    if (fileData.s[statId] > 0) coveredStatements++;
  }
  return (coveredStatements / statementsTotal) * 100;
}

/**
 * Calculate function coverage percentage for a file
 */
function calculateFunctionCoverage(fileData) {
  if (!fileData?.fnMap || !fileData.f) return 0;
  const functionsTotal = Object.keys(fileData.fnMap).length;
  if (functionsTotal === 0) return 0;
  let coveredFunctions = 0;
  for (const fnId in fileData.f) {
    if (fileData.f[fnId] > 0) coveredFunctions++;
  }
  return (coveredFunctions / functionsTotal) * 100;
}

/**
 * Calculate branch coverage percentage for a file
 */
function calculateBranchCoverage(fileData) {
  if (!fileData?.branchMap || !fileData.b) return 0;
  const branchesTotal = Object.keys(fileData.branchMap).length;
  if (branchesTotal === 0) return 0;
  let coveredBranches = 0;
  for (const brId in fileData.b) {
    const branches = fileData.b[brId];
    if (Array.isArray(branches) && branches.some(count => count > 0)) coveredBranches++;
    else if (branches > 0) coveredBranches++;
  }
  return (coveredBranches / branchesTotal) * 100;
}

/**
 * Output results to console with formatted tables
 */
function outputConsoleReport(results) {
  const { lowCoverageFiles, unusedFiles, overallStats } = results;

  console.log(`\n${colors.blue}===========================================${colors.reset}`);
  console.log(`${colors.blue}       CODE COVERAGE ANALYSIS REPORT       ${colors.reset}`);
  console.log(`${colors.blue}===========================================${colors.reset}\n`);
  console.log(`Generated on: ${new Date().toLocaleString()}\n`);

  // Overall Statistics
  console.log(`${colors.cyan}Overall Statistics:${colors.reset}`);
  console.log(`  Total Files: ${overallStats.totalFiles}`);
  console.log(`  Average Coverage: ${overallStats.averageCoverage.toFixed(2)}%`);
  console.log(`  Files Below Threshold (${COVERAGE_THRESHOLD}%): ${overallStats.filesBelowThreshold}`);
  console.log(`  Files With No Coverage: ${overallStats.filesWithNoCoverage}\n`);

  // Table helper function
  const printTable = (title, files, color) => {
    console.log(`${color}${title}:${colors.reset}`);
    if (files.length === 0) {
      console.log('  None found');
    } else {
      const headers = ['File Path', 'Statement', 'Function', 'Branch'];
      const colWidths = [50, 10, 10, 10]; // Fixed column widths for alignment
      const headerRow = headers.map((h, i) => h.padEnd(colWidths[i])).join(' | ');
      const separator = colWidths.map(w => '-'.repeat(w)).join('-+-');

      console.log(`  ${headerRow}`);
      console.log(`  ${separator}`);
      files.forEach(file => {
        const row = [
          file.path.padEnd(colWidths[0]),
          `${file.statement.toFixed(2)}%`.padEnd(colWidths[1]),
          `${file.function.toFixed(2)}%`.padEnd(colWidths[2]),
          `${file.branch.toFixed(2)}%`.padEnd(colWidths[3])
        ].join(' | ');
        console.log(`  ${row}`);
      });
    }
    console.log();
  };

  // Potentially Unused Files
  printTable('Potentially Unused Files (0% Coverage)', unusedFiles, colors.yellow);

  // Low Coverage Files
  printTable(`Low Coverage Files (< ${COVERAGE_THRESHOLD}%)`, lowCoverageFiles, colors.magenta);

  // Recommendations
  console.log(`${colors.cyan}Recommendations:${colors.reset}`);
  if (unusedFiles.length > 0) {
    console.log(`  Immediate Actions:`);
    console.log(`    1. Review ${unusedFiles.length} potentially unused files for removal`);
    console.log(`    2. Add tests for keepers`);
  }
  if (lowCoverageFiles.length > 0) {
    console.log(`  Short-term Actions:`);
    console.log(`    1. Improve coverage for ${lowCoverageFiles.length} low-coverage files`);
    console.log(`    2. Prioritize critical files`);
  }
  console.log(`  Long-term Actions:`);
  console.log(`    1. Maintain coverage above ${COVERAGE_THRESHOLD}%`);
  console.log(`    2. Schedule regular cleanups`);
  console.log(`    3. Use ESLint for unused code detection`);
  console.log(`\n${colors.blue}===========================================${colors.reset}\n`);
}

/**
 * Generate a markdown report (optional)
 */
function generateMarkdownReport(results) {
  const { lowCoverageFiles, unusedFiles, overallStats } = results;
  let reportContent = `# Code Coverage Analysis Report\n\nGenerated on: ${new Date().toLocaleString()}\n\n`;
  
  reportContent += `## Overall Statistics\n\n- Total Files: ${overallStats.totalFiles}\n- Average Coverage: ${overallStats.averageCoverage.toFixed(2)}%\n- Files Below Threshold (${COVERAGE_THRESHOLD}%): ${overallStats.filesBelowThreshold}\n- Files With No Coverage: ${overallStats.filesWithNoCoverage}\n\n`;
  
  reportContent += `## Potentially Unused Files (0% Coverage)\n\n`;
  reportContent += unusedFiles.length === 0 ? `*No potentially unused files found.*\n\n` : `| File Path | Statement | Function | Branch |\n|-----------|-----------|----------|--------|\n${unusedFiles.map(file => `| ${file.path} | ${file.statement.toFixed(2)}% | ${file.function.toFixed(2)}% | ${file.branch.toFixed(2)}% |`).join('\n')}\n\n`;
  
  reportContent += `## Low Coverage Files (< ${COVERAGE_THRESHOLD}%)\n\n`;
  reportContent += lowCoverageFiles.length === 0 ? `*No low coverage files found.*\n\n` : `| File Path | Statement | Function | Branch |\n|-----------|-----------|----------|--------|\n${lowCoverageFiles.map(file => `| ${file.path} | ${file.statement.toFixed(2)}% | ${file.function.toFixed(2)}% | ${file.branch.toFixed(2)}% |`).join('\n')}\n\n`;
  
  reportContent += `## Recommendations\n\n`;
  if (unusedFiles.length > 0) reportContent += `### Immediate Actions\n\n1. Review ${unusedFiles.length} potentially unused files for removal\n2. Add tests for keepers\n\n`;
  if (lowCoverageFiles.length > 0) reportContent += `### Short-term Actions\n\n1. Improve coverage for ${lowCoverageFiles.length} low-coverage files\n2. Prioritize critical files\n\n`;
  reportContent += `### Long-term Actions\n\n1. Maintain coverage above ${COVERAGE_THRESHOLD}%\n2. Schedule regular cleanups\n3. Use ESLint for unused code detection\n\n`;

  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, reportContent);
}

/**
 * Generate a JSON report (optional)
 */
function generateJSONReport(results) {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
}

/**
 * Output a focused summary for LLM consumption
 */
function outputLLMFocusedSummary(results) {
  const { lowCoverageFiles, unusedFiles } = results;
  const highImpactFiles = [...unusedFiles, ...lowCoverageFiles].map(file => {
    const filePath = path.join(process.cwd(), file.path);
    const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
    const lineCount = content.split('\n').length;
    const coverageRisk = 1 - (file.statement / 100);
    return { ...file, lineCount, impact: lineCount * coverageRisk };
  }).sort((a, b) => b.impact - a.impact);

  console.log(`${colors.blue}========= HIGH IMPACT AREAS ==========${colors.reset}\n`);
  console.log(`${colors.cyan}Top 5 High-Impact Areas:${colors.reset}`);
  highImpactFiles.slice(0, 5).forEach((file, i) => console.log(`${i + 1}. ${colors.yellow}${file.path}${colors.reset} - Coverage: ${file.statement.toFixed(2)}%, Impact: ${file.impact.toFixed(2)}, Lines: ${file.lineCount}`));
  console.log(`${colors.cyan}Priority Actions:${colors.reset}`);
  if (unusedFiles.length > 0) console.log(`1. Evaluate ${Math.min(unusedFiles.length, 20)} files with 0% coverage`);
  console.log(`2. Add tests to high-impact areas:`);
  highImpactFiles.slice(0, 3).forEach(file => console.log(`   - ${file.path}`));
  console.log();
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
${colors.cyan}Coverage Analyzer${colors.reset}
  
${colors.yellow}Description:${colors.reset}
  Analyzes existing code coverage data.

${colors.yellow}Usage:${colors.reset}
  node scripts/coverage-analyzer.js [options]

${colors.yellow}Options:${colors.reset}
  --help, -h         Show this help message
  --threshold=NUM    Set coverage threshold (default: 30)
  --format=TYPE      Output format: text (default), markdown, json
  --output=PATH      Custom output file path (for markdown/json)
  --run-tests        Run \`npm run test:coverage\` before analysis
  --run-e2e          Run \`npm run e2e:coverage\` before analysis

${colors.yellow}Examples:${colors.reset}
  node scripts/coverage-analyzer.js
  node scripts/coverage-analyzer.js --threshold=50 --format=markdown
  node scripts/coverage-analyzer.js --run-tests --run-e2e
`);
}

/**
 * Execute a command and exit on failure
 */
function safeExecSync(command) {
  try {
    execSync(command, { stdio: 'inherit', shell: true });
  } catch (error) {
    console.error(`\n${colors.red}Command failed with exit code ${error.status || 1}${colors.reset}`);
    process.exit(error.status || 1);
  }
}

// Run the analysis
analyzeCoverage();
