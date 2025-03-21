#!/usr/bin/env node

/**
 * Coverage Analyzer Script
 * 
 * This script analyzes Jest coverage reports to identify:
 * 1. Files with low coverage
 * 2. Potentially unused files/components
 * 3. Areas requiring immediate attention
 * 
 * Usage: 
 * 1. Run tests with coverage: npm run test:coverage
 * 2. Run this script: node scripts/coverage-analyzer.js
 * 
 * Options:
 * --threshold=40    Set coverage threshold (default: 30)
 * --format=json     Output format (markdown, json, or console)
 * --output=path     Custom output file path
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Enable strict failure mode (similar to shell's set -e)
// These handlers ensure the script exits on any unhandled error
process.on('uncaughtException', (error) => {
  console.error('\x1b[31mFatal error:', error.message, '\x1b[0m');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
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
  format: 'markdown',
  output: null,
  runTests: false,
  runE2E: false,
  mergeCoverage: false,
  help: false
};

// Update configuration section to use subdirectories
const COVERAGE_DIR = path.join(process.cwd(), 'coverage');
const COVERAGE_UNIT_DIR = path.join(COVERAGE_DIR, 'unit');
const COVERAGE_E2E_DIR = path.join(COVERAGE_DIR, 'e2e');
const COVERAGE_MERGED_DIR = path.join(COVERAGE_DIR, 'merged');
const COVERAGE_THRESHOLD = params.threshold;
const NYC_CONFIG_FILE = path.join(process.cwd(), '.nycrc.json');
const OUTPUT_FILE = params.output || path.join(process.cwd(), 'tmp', 'unused-code-report.' + (params.format === 'json' ? 'json' : 'md'));

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

// Log command line arguments for debugging
console.log(`${colors.magenta}Command line arguments:${colors.reset}`, args);

// Process command line arguments
args.forEach(arg => {
  if (arg.startsWith('--threshold=')) {
    params.threshold = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--format=')) {
    params.format = arg.split('=')[1];
  } else if (arg.startsWith('--output=')) {
    params.output = arg.split('=')[1];
  } else if (arg === '--run-tests') {
    params.runTests = true;
  } else if (arg === '--run-e2e') {
    params.runE2E = true;
  } else if (arg === '--merge-coverage') {
    params.mergeCoverage = true;
  } else if (arg === '--help' || arg === '-h') {
    params.help = true;
  }
});

/**
 * Check that all required dependencies are installed
 */
function checkDependencies(requiredForE2E = false) {
  // List of core dependencies needed
  const coreDependencies = ['minimatch', 'nyc'];
  
  // Additional dependencies needed for E2E tests
  const e2eDependencies = ['c8'];
  
  // All dependencies to check based on what we're running
  const dependencies = [...coreDependencies];
  if (requiredForE2E) {
    dependencies.push(...e2eDependencies);
  }
  
  // Check each dependency
  for (const dep of dependencies) {
    try {
      // Try to resolve the dependency
      const pkgPath = path.join(process.cwd(), 'node_modules', dep);
      if (!fs.existsSync(pkgPath)) {
        console.error(`${colors.red}Error: Required dependency '${dep}' is not installed.${colors.reset}`);
        console.error(`${colors.yellow}Please install it with: npm install --save-dev ${dep}${colors.reset}`);
        process.exit(1);
      }
    } catch (error) {
      console.error(`${colors.red}Error checking dependency '${dep}': ${error.message}${colors.reset}`);
      process.exit(1);
    }
  }

  return true;
}

/**
 * Main function to run the coverage analysis
 */
async function analyzeCoverage() {
  // Check if help was requested
  if (params.help) {
    showHelp();
    process.exit(0);
  }
  
  console.log(`${colors.cyan}Analyzing coverage data...${colors.reset}`);

  try {
    // Check for required dependencies
    checkDependencies(params.runE2E);

    // Run tests if requested
    if (params.runTests || params.runE2E || params.mergeCoverage) {
      console.log('\n');
      console.log(`${colors.blue}=== RUNNING TESTS WITH COVERAGE ===${colors.reset}`);
      console.log('\n');
      
      // Ensure config and directories exist
      ensureNycConfigExists();
      ensureIstanbulSetup();
      
      if (params.runE2E) {
        ensurePlaywrightConfig();
      }
      
      // Create/clean coverage directories
      [COVERAGE_DIR, COVERAGE_UNIT_DIR, COVERAGE_MERGED_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });
      
      if (params.runE2E && !fs.existsSync(COVERAGE_E2E_DIR)) {
        fs.mkdirSync(COVERAGE_E2E_DIR, { recursive: true });
      }
    
      // Run Jest tests with coverage
      if (params.runTests) {
        console.log(`\n${colors.blue}===> RUNNING JEST TESTS WITH COVERAGE${colors.reset}\n`);
        try {
          // Use safeExecSync instead of execSync
          safeExecSync(`npm test -- --coverage --coverageDirectory=${COVERAGE_UNIT_DIR}`);
          console.log(`\n${colors.green}===> JEST TESTS COMPLETED SUCCESSFULLY${colors.reset}\n`);
        } catch (error) {
          // This should never be reached with safeExecSync, but keeping for safety
          console.error(`\n${colors.red}===> JEST TESTS FAILED: ${error.message}${colors.reset}\n`);
          process.exit(1);
        }
      }
    
      // Run E2E tests with coverage
      if (params.runE2E) {
        console.log(`\n${colors.blue}===> RUNNING E2E TESTS WITH COVERAGE${colors.reset}\n`);
        try {
          // Set environment variables for Playwright coverage
          const e2eEnv = { 
            ...process.env, 
            PLAYWRIGHT_JUNIT_OUTPUT_NAME: 'results.xml',
            NODE_V8_COVERAGE: path.join(COVERAGE_E2E_DIR, 'tmp')
          };
          
          // Use safeExecSync instead of execSync
          safeExecSync('npm run e2e', { env: e2eEnv });
          
          // Convert V8 coverage to Istanbul/JSON format if temp dir exists
          const v8TempDir = path.join(COVERAGE_E2E_DIR, 'tmp');
          if (fs.existsSync(v8TempDir) && fs.readdirSync(v8TempDir).length > 0) {
            console.log(`\n${colors.blue}===> CONVERTING E2E COVERAGE TO JSON FORMAT${colors.reset}\n`);
            safeExecSync(`npx c8 report --reporter=json --report-dir=${COVERAGE_E2E_DIR}`);
          } else {
            console.warn(`\n${colors.yellow}===> NO V8 COVERAGE DATA FOUND FOR E2E TESTS${colors.reset}\n`);
          }
          
          console.log(`\n${colors.green}===> E2E TESTS COMPLETED SUCCESSFULLY${colors.reset}\n`);
        } catch (error) {
          // This should never be reached with safeExecSync, but keeping for safety
          console.error(`\n${colors.red}===> E2E TESTS FAILED: ${error.message}${colors.reset}\n`);
          process.exit(1);
        }
      }
    
      // Merge coverage reports if requested
      if (params.mergeCoverage) {
        // Only attempt to merge if we have multiple coverage sources
        const unitJsonPath = path.join(COVERAGE_UNIT_DIR, 'coverage-final.json');
        const e2eJsonPath = path.join(COVERAGE_E2E_DIR, 'coverage-final.json');
        const shouldMerge = (params.runTests && params.runE2E) || 
                           (fs.existsSync(unitJsonPath) && 
                            fs.existsSync(e2eJsonPath));
        
        if (shouldMerge) {
          console.log(`\n${colors.blue}===> MERGING COVERAGE REPORTS${colors.reset}\n`);
          
          try {
            // Ensure NYC is installed
            ensureNycIsInstalled();
            
            // Create a temporary directory to hold the JSON files
            const tempMergeDir = path.join(COVERAGE_DIR, 'temp-merge');
            if (!fs.existsSync(tempMergeDir)) {
              fs.mkdirSync(tempMergeDir, { recursive: true });
            }
            
            // Copy JSON files to the temp directory
            let filesCopied = 0;
            
            if (fs.existsSync(unitJsonPath)) {
              fs.copyFileSync(unitJsonPath, path.join(tempMergeDir, 'unit-coverage.json'));
              filesCopied++;
              console.log(`${colors.green}Copied unit test coverage to temp directory${colors.reset}`);
            }
            
            if (fs.existsSync(e2eJsonPath)) {
              fs.copyFileSync(e2eJsonPath, path.join(tempMergeDir, 'e2e-coverage.json'));
              filesCopied++;
              console.log(`${colors.green}Copied e2e test coverage to temp directory${colors.reset}`);
            }
            
            if (filesCopied === 0) {
              console.warn(`\n${colors.yellow}===> NO JSON COVERAGE FILES FOUND TO MERGE${colors.reset}\n`);
            } else if (filesCopied === 1) {
              console.log(`\n${colors.yellow}===> ONLY ONE JSON COVERAGE FILE FOUND, USING THAT${colors.reset}\n`);
              
              // Just copy the single file to the merged directory
              const sourcePath = fs.existsSync(unitJsonPath) ? unitJsonPath : e2eJsonPath;
              const targetJsonPath = path.join(COVERAGE_MERGED_DIR, 'coverage-final.json');
              
              fs.copyFileSync(sourcePath, targetJsonPath);
              
              // Also copy to the main coverage directory for analysis
              fs.copyFileSync(sourcePath, path.join(COVERAGE_DIR, 'coverage-final.json'));
              
              console.log(`\n${colors.green}===> COPIED SINGLE JSON FOR ANALYSIS${colors.reset}\n`);
            } else {
              // Use nyc merge to merge the JSON files
              const mergedJsonPath = path.join(COVERAGE_MERGED_DIR, 'coverage-final.json');
              
              console.log(`\n${colors.blue}===> EXECUTING NYC MERGE COMMAND${colors.reset}\n`);
              safeExecSync(`npx nyc merge ${tempMergeDir} ${mergedJsonPath}`);
              
              // Copy the merged JSON to the main coverage directory for analysis
              fs.copyFileSync(mergedJsonPath, path.join(COVERAGE_DIR, 'coverage-final.json'));
              
              console.log(`\n${colors.green}===> COVERAGE MERGING COMPLETED SUCCESSFULLY${colors.reset}\n`);
              
              // Generate HTML report from the merged JSON using NYC
              try {
                console.log(`\n${colors.blue}===> GENERATING HTML REPORT FROM MERGED JSON${colors.reset}\n`);
                safeExecSync(`npx nyc report --reporter=html --report-dir=${COVERAGE_MERGED_DIR}/html`, {
                  env: {
                    ...process.env,
                    NYC_CWD: process.cwd(),
                    NYC_CONFIG: JSON.stringify({
                      tempDir: tempMergeDir,
                      reportDir: `${COVERAGE_MERGED_DIR}/html`
                    })
                  },
                  stdio: 'inherit',
                  shell: true
                });
              } catch (e) {
                console.warn(`\n${colors.yellow}===> COULD NOT GENERATE HTML REPORT: ${e.message}${colors.reset}\n`);
              }
            }
            
            // Clean up the temporary directory
            try {
              fs.rmSync(tempMergeDir, { recursive: true, force: true });
            } catch (error) {
              console.warn(`\n${colors.yellow}===> COULD NOT CLEAN UP TEMP DIRECTORY: ${error.message}${colors.reset}\n`);
            }
          } catch (error) {
            console.error(`\n${colors.red}===> ERROR MERGING COVERAGE: ${error.message}${colors.reset}\n`);
            
            // Try to use the largest JSON file from unit or e2e as fallback
            const unitJsonPath = path.join(COVERAGE_UNIT_DIR, 'coverage-final.json');
            const e2eJsonPath = path.join(COVERAGE_E2E_DIR, 'coverage-final.json');
            
            let sourcePath = null;
            
            // Determine which JSON file to use as fallback (prefer the larger one)
            if (fs.existsSync(unitJsonPath) && fs.existsSync(e2eJsonPath)) {
              const unitStats = fs.statSync(unitJsonPath);
              const e2eStats = fs.statSync(e2eJsonPath);
              
              sourcePath = unitStats.size >= e2eStats.size ? unitJsonPath : e2eJsonPath;
              console.log(`\n${colors.yellow}===> USING ${sourcePath} AS FALLBACK (LARGER FILE)${colors.reset}\n`);
            } else if (fs.existsSync(unitJsonPath)) {
              sourcePath = unitJsonPath;
              console.log(`\n${colors.yellow}===> USING UNIT TEST JSON AS FALLBACK${colors.reset}\n`);
            } else if (fs.existsSync(e2eJsonPath)) {
              sourcePath = e2eJsonPath;
              console.log(`\n${colors.yellow}===> USING E2E TEST JSON AS FALLBACK${colors.reset}\n`);
            }
            
            if (sourcePath) {
              fs.copyFileSync(sourcePath, path.join(COVERAGE_DIR, 'coverage-final.json'));
              console.log(`\n${colors.green}===> COPIED FALLBACK JSON FOR ANALYSIS${colors.reset}\n`);
            } else {
              console.error(`\n${colors.red}===> NO FALLBACK JSON FILES AVAILABLE${colors.reset}\n`);
              if (params.mergeCoverage) {
                process.exit(1);
              }
            }
          }
        } else {
          console.log(`\n${colors.yellow}===> SKIPPING MERGE: NOT ENOUGH COVERAGE SOURCES AVAILABLE${colors.reset}\n`);
        }
      }
      
      // Verify we have coverage data to analyze
      const finalJson = path.join(COVERAGE_DIR, 'coverage-final.json');
      if (!fs.existsSync(finalJson)) {
        console.error(`\n${colors.red}===> NO COVERAGE DATA FOUND AFTER RUNNING TESTS${colors.reset}\n`);
        // Use JSON from Jest tests directly if it exists
        const jestJson = path.join(COVERAGE_UNIT_DIR, 'coverage-final.json');
        if (fs.existsSync(jestJson)) {
          console.log(`\n${colors.yellow}===> USING UNIT TEST COVERAGE FOR ANALYSIS${colors.reset}\n`);
          fs.copyFileSync(jestJson, finalJson);
        } else {
          // Exit with error instead of attempting to continue
          console.error(`${colors.red}Fatal: No coverage data available for analysis${colors.reset}`);
          process.exit(1);
        }
      }
      
      // Check if the finalJson file has content
      try {
        const jsonContent = fs.readFileSync(finalJson, 'utf8');
        if (!jsonContent || jsonContent.trim().length === 0 || jsonContent === '{}') {
          console.error(`\n${colors.red}===> COVERAGE FILE IS EMPTY OR INVALID${colors.reset}\n`);
          
          // Try to fix by using individual source files
          const unitJsonPath = path.join(COVERAGE_UNIT_DIR, 'coverage-final.json');
          const e2eJsonPath = path.join(COVERAGE_E2E_DIR, 'coverage-final.json');
          
          if (fs.existsSync(unitJsonPath) && fs.statSync(unitJsonPath).size > 2) {
            console.log(`\n${colors.yellow}===> USING UNIT TEST COVERAGE AS FALLBACK${colors.reset}\n`);
            fs.copyFileSync(unitJsonPath, finalJson);
          } else if (fs.existsSync(e2eJsonPath) && fs.statSync(e2eJsonPath).size > 2) {
            console.log(`\n${colors.yellow}===> USING E2E TEST COVERAGE AS FALLBACK${colors.reset}\n`);
            fs.copyFileSync(e2eJsonPath, finalJson);
          } else {
            console.error(`${colors.red}Fatal: No valid coverage data available for analysis${colors.reset}`);
            process.exit(1);
          }
        }
      } catch (error) {
        console.error(`\n${colors.red}===> ERROR READING COVERAGE FILE: ${error.message}${colors.reset}\n`);
        process.exit(1);
      }
      
      console.log(`\n${colors.green}=== TESTS COMPLETED, CONTINUING WITH ANALYSIS ===${colors.reset}\n`);
    }

    // Continue with coverage analysis

    // Read ignore patterns
    const ignorePatterns = readIgnorePatterns();
    
    // Check if coverage directory exists
    if (!fs.existsSync(COVERAGE_DIR)) {
      console.error(`${colors.red}Error: Coverage directory not found. Run "npm run test:coverage" first.${colors.reset}`);
      process.exit(1);
    }

    // Read coverage data from the final.json file
    const coverageJSON = path.join(COVERAGE_DIR, 'coverage-final.json');
    if (!fs.existsSync(coverageJSON)) {
      console.error(`${colors.red}Error: Coverage data not found. Run "npm run test:coverage" first.${colors.reset}`);
      process.exit(1);
    }

    // Parsing coverage data is critical - if this fails, exit
    let coverageData;
    try {
      const fileContent = fs.readFileSync(coverageJSON, 'utf8');
      if (!fileContent || fileContent.trim().length === 0) {
        console.error(`${colors.red}Error: Coverage file is empty.${colors.reset}`);
        // Try to use unit or e2e data directly
        let alternateFile = null;
        const unitCoverage = path.join(COVERAGE_UNIT_DIR, 'coverage-final.json');
        const e2eCoverage = path.join(COVERAGE_E2E_DIR, 'coverage-final.json');
        
        if (fs.existsSync(unitCoverage) && fs.statSync(unitCoverage).size > 0) {
          alternateFile = unitCoverage;
          console.log(`${colors.yellow}Trying to use unit coverage instead...${colors.reset}`);
        } else if (fs.existsSync(e2eCoverage) && fs.statSync(e2eCoverage).size > 0) {
          alternateFile = e2eCoverage;
          console.log(`${colors.yellow}Trying to use e2e coverage instead...${colors.reset}`);
        }
        
        if (alternateFile) {
          const altContent = fs.readFileSync(alternateFile, 'utf8');
          coverageData = JSON.parse(altContent);
        } else {
          process.exit(1);
        }
      } else {
        coverageData = JSON.parse(fileContent);
      }
      
      // Verify we have actual coverage data
      if (!coverageData || Object.keys(coverageData).length === 0) {
        console.error(`${colors.red}Error: Coverage data is empty or invalid.${colors.reset}`);
        // Try to check individual files
        const unitCoverage = path.join(COVERAGE_UNIT_DIR, 'coverage-final.json');
        const e2eCoverage = path.join(COVERAGE_E2E_DIR, 'coverage-final.json');
        
        console.log(`${colors.yellow}Checking individual coverage files...${colors.reset}`);
        let alternateData = null;
        
        if (fs.existsSync(unitCoverage)) {
          try {
            const unitData = JSON.parse(fs.readFileSync(unitCoverage, 'utf8'));
            if (unitData && Object.keys(unitData).length > 0) {
              console.log(`${colors.green}Found valid unit test coverage data with ${Object.keys(unitData).length} files${colors.reset}`);
              alternateData = unitData;
            }
          } catch (e) {
            console.error(`${colors.red}Error reading unit coverage: ${e.message}${colors.reset}`);
          }
        }
        
        if (!alternateData && fs.existsSync(e2eCoverage)) {
          try {
            const e2eData = JSON.parse(fs.readFileSync(e2eCoverage, 'utf8'));
            if (e2eData && Object.keys(e2eData).length > 0) {
              console.log(`${colors.green}Found valid e2e test coverage data with ${Object.keys(e2eData).length} files${colors.reset}`);
              alternateData = e2eData;
            }
          } catch (e) {
            console.error(`${colors.red}Error reading e2e coverage: ${e.message}${colors.reset}`);
          }
        }
        
        if (alternateData) {
          coverageData = alternateData;
        } else {
          process.exit(1);
        }
      }
    } catch (error) {
      console.error(`${colors.red}Error parsing coverage data: ${error.message}${colors.reset}`);
      process.exit(1);
    }

    // Check for empty data
    if (!coverageData || Object.keys(coverageData).length === 0) {
      console.error(`${colors.red}Error: No valid coverage data found after all attempts.${colors.reset}`);
      process.exit(1);
    }

    console.log(`${colors.green}Found coverage data for ${Object.keys(coverageData).length} files${colors.reset}`);

    // Process the coverage data
    const results = processCoverageData(coverageData, ignorePatterns);
    
    // Generate the report based on format
    if (params.format === 'json') {
      generateJSONReport(results);
    } else if (params.format === 'console') {
      outputConsoleReport(results);
    } else {
      generateMarkdownReport(results);
    }
    
    console.log(`${colors.green}Analysis complete! Report saved to: ${OUTPUT_FILE}${colors.reset}`);
    
    // Output focused summary for LLM consumption
    outputLLMFocusedSummary(results);
  } catch (error) {
    console.error(`${colors.red}Fatal error during analysis: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

/**
 * Output a focused summary for LLM consumption
 */
function outputLLMFocusedSummary(results) {
  const { lowCoverageFiles, unusedFiles, overallStats } = results;
  
  // Sort files by impact (lines of code * risk)
  const highImpactFiles = [...unusedFiles, ...lowCoverageFiles].map(file => {
    try {
      const filePath = path.join(process.cwd(), file.path);
      const content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
      const lineCount = content.split('\n').length;
      // Calculate impact score: more lines with less coverage = higher impact
      const coverageRisk = 1 - (file.statement / 100);
      const impact = lineCount * coverageRisk;
      
      return {
        ...file,
        lineCount,
        impact
      };
    } catch (error) {
      return {
        ...file,
        lineCount: 0,
        impact: 0
      };
    }
  }).sort((a, b) => b.impact - a.impact);
  
  console.log('\n');
  console.log(`${colors.blue}========= HIGH IMPACT AREAS ==========${colors.reset}`);
  console.log('\n');
  
  console.log(`${colors.cyan}Top 5 High-Impact Areas With Zero or Low Coverage:${colors.reset}`);
  highImpactFiles.slice(0, 5).forEach((file, index) => {
    console.log(`${index + 1}. ${colors.yellow}${file.path}${colors.reset} - Coverage: ${file.statement.toFixed(2)}%, Impact: ${file.impact.toFixed(2)}, Lines: ${file.lineCount}`);
  });
  
  console.log('\n');
  console.log(`${colors.cyan}Priority Actions:${colors.reset}`);
  if (unusedFiles.length > 0) {
    console.log(`1. Evaluate ${Math.min(unusedFiles.length, 20)} files with zero coverage for removal/testing`);
  }
  console.log(`2. Add tests to high-impact areas, starting with:`);
  highImpactFiles.slice(0, 3).forEach((file, index) => {
    console.log(`   - ${file.path}`);
  });
  
  console.log('\n');
}

/**
 * Process the coverage data to extract useful metrics
 */
function processCoverageData(coverageData, ignorePatterns) {
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
  
  // Check if coverageData is empty
  if (!coverageData || Object.keys(coverageData).length === 0) {
    console.error(`${colors.red}Error: Empty coverage data object${colors.reset}`);
    console.log(`${colors.yellow}Attempting to read from unit and e2e directories directly...${colors.reset}`);
    
    // Try to read directly from unit and e2e directories
    const unitJsonPath = path.join(COVERAGE_UNIT_DIR, 'coverage-final.json');
    const e2eJsonPath = path.join(COVERAGE_E2E_DIR, 'coverage-final.json');
    
    if (fs.existsSync(unitJsonPath)) {
      try {
        const unitData = JSON.parse(fs.readFileSync(unitJsonPath, 'utf8'));
        if (unitData && Object.keys(unitData).length > 0) {
          console.log(`${colors.green}Found valid coverage data in unit tests${colors.reset}`);
          coverageData = unitData;
        }
      } catch (e) {
        console.error(`${colors.red}Error reading unit test coverage: ${e.message}${colors.reset}`);
      }
    }
    
    if ((!coverageData || Object.keys(coverageData).length === 0) && fs.existsSync(e2eJsonPath)) {
      try {
        const e2eData = JSON.parse(fs.readFileSync(e2eJsonPath, 'utf8'));
        if (e2eData && Object.keys(e2eData).length > 0) {
          console.log(`${colors.green}Found valid coverage data in e2e tests${colors.reset}`);
          coverageData = e2eData;
        }
      } catch (e) {
        console.error(`${colors.red}Error reading e2e test coverage: ${e.message}${colors.reset}`);
      }
    }
    
    // If we still don't have valid coverage data, return empty results
    if (!coverageData || Object.keys(coverageData).length === 0) {
      console.error(`${colors.red}Could not find valid coverage data${colors.reset}`);
      return results;
    }
  }
  
  console.log(`${colors.green}Processing coverage data for ${Object.keys(coverageData).length} files${colors.reset}`);
  
  // Process each file in the coverage data
  for (const filePath in coverageData) {
    const fileData = coverageData[filePath];
    const fileName = path.basename(filePath);
    const relativePath = filePath.replace(process.cwd(), '');
    
    if (!fileData || !fileData.statementMap) {
      console.warn(`${colors.yellow}Invalid coverage data for ${fileName}, skipping${colors.reset}`);
      continue;
    }
    
    // Calculate statement coverage percentage
    const statementCoverage = calculateStatementCoverage(fileData);
    
    // Calculate function coverage
    const functionCoverage = calculateFunctionCoverage(fileData);
    
    // Calculate branch coverage
    const branchCoverage = calculateBranchCoverage(fileData);
    
    // Track total for average calculation
    totalCoverage += statementCoverage;
    results.overallStats.totalFiles++;
    
    // Check if file has low coverage
    if (statementCoverage < COVERAGE_THRESHOLD) {
      results.overallStats.filesBelowThreshold++;
      
      // Check if file is potentially unused (very low coverage)
      if (statementCoverage === 0) {
        results.overallStats.filesWithNoCoverage++;
        results.unusedFiles.push({
          path: relativePath,
          statement: statementCoverage,
          function: functionCoverage,
          branch: branchCoverage
        });
      } else {
        results.lowCoverageFiles.push({
          path: relativePath,
          statement: statementCoverage,
          function: functionCoverage,
          branch: branchCoverage
        });
      }
    }
  }
  
  // Calculate overall average
  results.overallStats.averageCoverage = 
    results.overallStats.totalFiles ? totalCoverage / results.overallStats.totalFiles : 0;
  
  return results;
}

/**
 * Calculate statement coverage percentage for a file
 */
function calculateStatementCoverage(fileData) {
  if (!fileData || !fileData.statementMap || !fileData.s) {
    return 0;
  }
  
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
  if (!fileData || !fileData.fnMap || !fileData.f) {
    return 0;
  }
  
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
  if (!fileData || !fileData.branchMap || !fileData.b) {
    return 0;
  }
  
  const branchesTotal = Object.keys(fileData.branchMap).length;
  if (branchesTotal === 0) return 0;
  
  let coveredBranches = 0;
  for (const brId in fileData.b) {
    const branches = fileData.b[brId];
    if (Array.isArray(branches)) {
      if (branches.some(count => count > 0)) {
        coveredBranches++;
      }
    } else if (branches > 0) {
      coveredBranches++;
    }
  }
  
  return (coveredBranches / branchesTotal) * 100;
}

/**
 * Generate a markdown report with the results
 */
function generateMarkdownReport(results) {
  const { lowCoverageFiles, unusedFiles, overallStats } = results;
  
  // Create the report content
  let reportContent = `# Code Coverage Analysis Report\n\n`;
  reportContent += `Generated on: ${new Date().toLocaleString()}\n\n`;
  
  // Overall stats
  reportContent += `## Overall Statistics\n\n`;
  reportContent += `- Total Files: ${overallStats.totalFiles}\n`;
  reportContent += `- Average Coverage: ${overallStats.averageCoverage.toFixed(2)}%\n`;
  reportContent += `- Files Below Threshold (${COVERAGE_THRESHOLD}%): ${overallStats.filesBelowThreshold}\n`;
  reportContent += `- Files With No Coverage: ${overallStats.filesWithNoCoverage}\n\n`;
  
  // Potentially unused files
  reportContent += `## Potentially Unused Files (0% Coverage)\n\n`;
  if (unusedFiles.length === 0) {
    reportContent += `*No potentially unused files found.*\n\n`;
  } else {
    reportContent += `| File Path | Statement | Function | Branch |\n`;
    reportContent += `|-----------|-----------|----------|--------|\n`;
    unusedFiles.forEach(file => {
      reportContent += `| ${file.path} | ${file.statement.toFixed(2)}% | ${file.function.toFixed(2)}% | ${file.branch.toFixed(2)}% |\n`;
    });
    reportContent += `\n`;
  }
  
  // Low coverage files
  reportContent += `## Low Coverage Files (< ${COVERAGE_THRESHOLD}%)\n\n`;
  if (lowCoverageFiles.length === 0) {
    reportContent += `*No low coverage files found.*\n\n`;
  } else {
    reportContent += `| File Path | Statement | Function | Branch |\n`;
    reportContent += `|-----------|-----------|----------|--------|\n`;
    lowCoverageFiles.forEach(file => {
      reportContent += `| ${file.path} | ${file.statement.toFixed(2)}% | ${file.function.toFixed(2)}% | ${file.branch.toFixed(2)}% |\n`;
    });
    reportContent += `\n`;
  }
  
  // Recommendations
  reportContent += `## Recommendations\n\n`;
  
  if (unusedFiles.length > 0) {
    reportContent += `### Immediate Actions\n\n`;
    reportContent += `1. Review the ${unusedFiles.length} potentially unused files and consider removal\n`;
    reportContent += `2. For files that should be kept, write tests to increase coverage\n\n`;
  }
  
  if (lowCoverageFiles.length > 0) {
    reportContent += `### Short-term Actions\n\n`;
    reportContent += `1. Improve test coverage for the ${lowCoverageFiles.length} files with low coverage\n`;
    reportContent += `2. Prioritize files based on their importance to the application\n\n`;
  }
  
  reportContent += `### Long-term Actions\n\n`;
  reportContent += `1. Set up regular coverage checks to maintain coverage above ${COVERAGE_THRESHOLD}%\n`;
  reportContent += `2. Implement regular code cleanup sprints\n`;
  reportContent += `3. Add ESLint rules to detect unused code\n\n`;
  
  // E2E test recommendations 
  reportContent += `### Testing Recommendations\n\n`;
  reportContent += `1. Add e2e tests for critical user flows to ensure functionality is preserved\n`;
  reportContent += `2. Focus on testing user-facing components before removing any code\n`;
  reportContent += `3. Create a map of important features and ensure they have test coverage\n\n`;
  
  // Write the report to a file
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_FILE, reportContent);
}

/**
 * Generate a JSON report with the results
 */
function generateJSONReport(results) {
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
}

/**
 * Output results to console
 */
function outputConsoleReport(results) {
  const { lowCoverageFiles, unusedFiles, overallStats } = results;
  
  console.log('\n');
  console.log(`${colors.blue}========= COVERAGE ANALYSIS REPORT ==========${colors.reset}`);
  console.log('\n');
  console.log(`${colors.cyan}Overall Statistics:${colors.reset}`);
  console.log(`  Total Files: ${overallStats.totalFiles}`);
  console.log(`  Average Coverage: ${overallStats.averageCoverage.toFixed(2)}%`);
  console.log(`  Files Below Threshold (${COVERAGE_THRESHOLD}%): ${overallStats.filesBelowThreshold}`);
  console.log(`  Files With No Coverage: ${overallStats.filesWithNoCoverage}`);
  
  console.log('\n');
  console.log(`${colors.yellow}Potentially Unused Files (0% Coverage):${colors.reset}`);
  if (unusedFiles.length === 0) {
    console.log('  No potentially unused files found.');
  } else {
    unusedFiles.forEach(file => {
      console.log(`  ${file.path} (Statement: ${file.statement.toFixed(2)}%, Function: ${file.function.toFixed(2)}%, Branch: ${file.branch.toFixed(2)}%)`);
    });
  }
  
  console.log('\n');
  console.log(`${colors.magenta}Low Coverage Files (< ${COVERAGE_THRESHOLD}%):${colors.reset}`);
  if (lowCoverageFiles.length === 0) {
    console.log('  No low coverage files found.');
  } else {
    lowCoverageFiles.forEach(file => {
      console.log(`  ${file.path} (Statement: ${file.statement.toFixed(2)}%, Function: ${file.function.toFixed(2)}%, Branch: ${file.branch.toFixed(2)}%)`);
    });
  }
  
  console.log('\n');
  console.log(`${colors.blue}===========================================${colors.reset}`);
  console.log('\n');
}

/**
 * Output a brief summary to console
 */
function outputSummary(results) {
  const { unusedFiles, lowCoverageFiles, overallStats } = results;
  
  console.log(`${colors.yellow}Summary:${colors.reset}`);
  console.log(`  Average Coverage: ${colors.cyan}${overallStats.averageCoverage.toFixed(2)}%${colors.reset}`);
  console.log(`  Potentially Unused Files: ${colors.red}${unusedFiles.length}${colors.reset}`);
  console.log(`  Low Coverage Files: ${colors.yellow}${lowCoverageFiles.length}${colors.reset}`);
  
  if (unusedFiles.length > 0) {
    console.log(`\n${colors.red}Top potentially unused files:${colors.reset}`);
    unusedFiles.slice(0, 5).forEach(file => {
      console.log(`  ${file.path}`);
    });
    if (unusedFiles.length > 5) {
      console.log(`  ... and ${unusedFiles.length - 5} more`);
    }
  }
}

/**
 * Ensure Playwright is properly configured for coverage
 */
function ensurePlaywrightConfig() {
  // Create a .env file for Playwright if it doesn't exist
  const envFile = path.join(process.cwd(), '.env.e2e');
  if (!fs.existsSync(envFile)) {
    fs.writeFileSync(envFile, 'PLAYWRIGHT_JUNIT_OUTPUT_NAME=results.xml\n');
  }
  
  // Create the playwright directory for V8 coverage
  const playwrightCoverageDir = path.join(COVERAGE_E2E_DIR, 'tmp');
  if (!fs.existsSync(playwrightCoverageDir)) {
    fs.mkdirSync(playwrightCoverageDir, { recursive: true });
  }
}

/**
 * Ensure Istanbul is properly set up
 */
function ensureIstanbulSetup() {
  // Create .nycrc.json if it doesn't exist
  if (!fs.existsSync(NYC_CONFIG_FILE)) {
    ensureNycConfigExists();
  }
  
  // Create temporary directory for coverage data if needed
  const tempDir = path.join(COVERAGE_UNIT_DIR, 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  
  // Create a .gitignore in coverage directory if it doesn't exist
  const gitignoreFile = path.join(COVERAGE_DIR, '.gitignore');
  try {
    if (!fs.existsSync(gitignoreFile)) {
      fs.writeFileSync(gitignoreFile, 'temp/\n*.raw.json\n');
    }
  } catch (error) {
    console.warn(`${colors.yellow}Could not create .gitignore in coverage: ${error.message}${colors.reset}`);
  }
  
  // Handle .nyc_output directory - ensure it exists with a proper .gitignore
  const nycOutputDir = path.join(process.cwd(), '.nyc_output');
  if (!fs.existsSync(nycOutputDir)) {
    fs.mkdirSync(nycOutputDir, { recursive: true });
    
    // Create a .gitignore in .nyc_output directory
    try {
      const nycGitignoreFile = path.join(nycOutputDir, '.gitignore');
      if (!fs.existsSync(nycGitignoreFile)) {
        fs.writeFileSync(nycGitignoreFile, '*\n!.gitignore\n');
      }
    } catch (error) {
      console.warn(`${colors.yellow}Could not create .gitignore in .nyc_output: ${error.message}${colors.reset}`);
    }
  }
}

/**
 * Ensure NYC configuration file exists
 */
function ensureNycConfigExists() {
  if (!fs.existsSync(NYC_CONFIG_FILE)) {
    console.log(`${colors.yellow}Creating default NYC configuration...${colors.reset}`);
    
    const defaultConfig = {
      "extends": "@istanbuljs/nyc-config-typescript",
      "all": true,
      "check-coverage": false,
      "include": [
        "src/**/*.ts",
        "src/**/*.tsx"
      ],
      "exclude": [
        "**/*.d.ts",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts", 
        "**/*.spec.tsx",
        "**/*.e2e.ts",
        "**/*.e2e.tsx",
        "src/test/**/*",
        "src/tests/**/*",
        "src/e2e/**/*",
        "src/types/**/*",
        "dist/**/*",
        "**/node_modules/**"
      ],
      "reporter": [
        "json",
        "text-summary",
        "html"
      ],
      "report-dir": "./coverage/unit",
      "temp-dir": "./coverage/unit/temp",
      "cwd": process.cwd(),
      "source-map": true,
      "produce-source-map": true,
      "instrument": true,
      "require": [
        "ts-node/register"
      ]
    };
    
    fs.writeFileSync(NYC_CONFIG_FILE, JSON.stringify(defaultConfig, null, 2));
    console.log(`${colors.green}NYC configuration created at ${NYC_CONFIG_FILE}${colors.reset}`);
  }
  
  // Also ensure we have a c8 config for Playwright E2E tests
  const c8ConfigFile = path.join(process.cwd(), '.c8rc.json');
  if (!fs.existsSync(c8ConfigFile) && params.runE2E) {
    const c8Config = {
      "extends": "./.nycrc.json",
      "include": [
        "src/**/*.ts",
        "src/**/*.tsx"
      ],
      "reporter": [
        "json"
      ],
      "report-dir": "./coverage/e2e",
      "temp-dir": "./coverage/e2e/tmp",
      "all": true
    };
    
    fs.writeFileSync(c8ConfigFile, JSON.stringify(c8Config, null, 2));
    console.log(`${colors.green}C8 E2E configuration created at ${c8ConfigFile}${colors.reset}`);
  }
}

/**
 * Ensure NYC is properly configured for JSON reporting
 */
function ensureNycIsInstalled() {
  try {
    // Check if nyc is installed
    const nycPath = path.join(process.cwd(), 'node_modules', 'nyc');
    if (!fs.existsSync(nycPath)) {
      console.error(`${colors.red}Error: nyc is not installed.${colors.reset}`);
      console.error(`${colors.yellow}Please install it with: npm install --save-dev nyc${colors.reset}`);
      throw new Error('Missing dependency: nyc');
    }
    
    console.log(`${colors.green}NYC is installed and ready for use${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}Error checking NYC installation: ${error.message}${colors.reset}`);
    throw error;
  }
}

/**
 * Display help information
 */
function showHelp() {
  console.log(`
${colors.cyan}Coverage Analyzer${colors.reset}
  
${colors.yellow}Description:${colors.reset}
  Analyzes code coverage data to identify areas needing improvement.

${colors.yellow}Usage:${colors.reset}
  node scripts/coverage-analyzer.js [options]

${colors.yellow}Options:${colors.reset}
  --help, -h         Show this help message
  --threshold=NUM    Set coverage threshold percentage (default: 30)
  --format=FORMAT    Output format: markdown, json, console (default: markdown)
  --output=PATH      Custom output file path
  --run-tests        Run Jest tests with coverage before analysis
  --run-e2e          Run E2E tests with coverage before analysis
  --merge-coverage   Merge Jest and E2E coverage results

${colors.yellow}Examples:${colors.reset}
  node scripts/coverage-analyzer.js
  node scripts/coverage-analyzer.js --threshold=50 --format=console
  node scripts/coverage-analyzer.js --run-tests --run-e2e --merge-coverage

${colors.yellow}NPM Scripts:${colors.reset}
  npm run coverage:analyze      Run analysis on existing coverage data
  npm run coverage:full         Run tests, merge coverage, and analyze
  npm run coverage:merge        Merge existing coverage data and analyze
`);
}

/**
 * Read ignore patterns from .coverageignore if it exists
 */
function readIgnorePatterns() {
  const ignoreFile = path.join(process.cwd(), '.coverageignore');
  let patterns = [];
  
  if (fs.existsSync(ignoreFile)) {
    try {
      const content = fs.readFileSync(ignoreFile, 'utf8');
      patterns = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
      
      if (patterns.length > 0) {
        console.log(`${colors.cyan}Loaded ${patterns.length} ignore patterns from .coverageignore${colors.reset}`);
      }
    } catch (error) {
      console.warn(`${colors.yellow}Warning: Could not read .coverageignore file: ${error.message}${colors.reset}`);
    }
  }
  
  return patterns;
}

/**
 * Execute a command and exit on failure
 */
function safeExecSync(command, options = {}) {
  try {
    return execSync(command, { 
      stdio: 'inherit',
      ...options,
      shell: true
    });
  } catch (error) {
    console.error(`\n${colors.red}Command failed with exit code ${error.status || 1}${colors.reset}`);
    process.exit(error.status || 1);
  }
}

/**
 * Check if a command exists in the system
 */
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a JSON coverage file is valid
 */
function isValidCoverageJson(jsonPath) {
  try {
    if (!fs.existsSync(jsonPath)) {
      return false;
    }
    
    const content = fs.readFileSync(jsonPath, 'utf8');
    if (!content || content.trim().length === 0) {
      return false;
    }
    
    const data = JSON.parse(content);
    return Object.keys(data).length > 0;
  } catch (error) {
    console.error(`${colors.red}Invalid JSON coverage file: ${error.message}${colors.reset}`);
    return false;
  }
}

// Run the analysis
analyzeCoverage(); 