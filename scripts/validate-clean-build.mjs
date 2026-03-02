#!/usr/bin/env node

/**
 * Validate Clean Build Script
 *
 * Ensures that development metadata folders are excluded from build artifacts.
 * Used by prepublishOnly hook to prevent accidental inclusion of dev files.
 *
 * Performance Optimized (ENH-003):
 * - Parallel checks using Promise.all()
 * - Target: < 1 second execution time
 * - Async file system operations
 *
 * Checks:
 * 1. .npmignore exists and contains required exclusions
 * 2. dist/ folder is clean (forbidden folders + patterns)
 * 3. Development folders exist in root
 */

import { readFile, readdir, access } from 'fs/promises';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = resolve(__dirname, '..');

// Helper function to check if file/folder exists (async)
async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function warn(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

// Folders that should NEVER be in build output
const FORBIDDEN_FOLDERS = [
  '.specify',
  'conductor',
  'specs',
  'track-docs',
];

// File patterns that should NOT be in dist/ (Extended Validation)
const FORBIDDEN_PATTERNS = [
  { pattern: '.log', description: 'Log files' },
  { pattern: '.env', description: 'Environment files' },
  { pattern: '.test.ts', description: 'Test files (TypeScript)' },
  { pattern: '.spec.ts', description: 'Specification files (TypeScript)' },
  { pattern: '.test.js', description: 'Test files (JavaScript)' },
  { pattern: '.spec.js', description: 'Specification files (JavaScript)' },
  { pattern: 'coverage/', description: 'Coverage reports' },
  { pattern: '.tmp', description: 'Temporary files' },
  { pattern: '.bak', description: 'Backup files' },
];

// Files that MUST be in .npmignore
const REQUIRED_NPM_IGNORE_ENTRIES = [
  '.specify/',
  'conductor/',
  'node_modules/',
];

/**
 * Check if .npmignore exists and contains required entries
 */
async function checkNpmIgnore() {
  const npmIgnorePath = join(rootDir, '.npmignore');
  const issues = [];
  
  try {
    if (!await exists(npmIgnorePath)) {
      issues.push({ type: 'error', message: '.npmignore file does not exist' });
      return issues;
    }
    
    success('.npmignore file exists');
    
    const npmIgnoreContent = await readFile(npmIgnorePath, 'utf-8');
    
    for (const entry of REQUIRED_NPM_IGNORE_ENTRIES) {
      if (!npmIgnoreContent.includes(entry)) {
        issues.push({ type: 'error', message: `.npmignore missing required entry: ${entry}` });
      } else {
        success(`.npmignore contains: ${entry}`);
      }
    }
  } catch (err) {
    issues.push({ type: 'error', message: `Failed to read .npmignore: ${err.message}` });
  }
  
  return issues;
}

/**
 * Check dist/ folder for forbidden folders and file patterns
 */
async function checkDistFolder() {
  const distPath = join(rootDir, 'dist');
  const issues = [];
  
  try {
    if (!await exists(distPath)) {
      issues.push({ type: 'warn', message: 'dist/ folder does not exist (run build first)' });
      return issues;
    }
    
    info('\nChecking dist/ folder for forbidden files...');
    
    // Check forbidden folders
    for (const folder of FORBIDDEN_FOLDERS) {
      const forbiddenPath = join(distPath, folder);
      if (await exists(forbiddenPath)) {
        issues.push({ type: 'error', message: `Forbidden folder found in dist/: ${folder}/` });
      } else {
        success(`${folder}/ not in dist/`);
      }
    }
    
    // Check forbidden file patterns
    info('\nChecking dist/ for forbidden file patterns...');
    const patternIssues = await checkForbiddenPatterns(distPath);
    
    if (patternIssues.length > 0) {
      for (const issue of patternIssues) {
        issues.push({ type: 'error', message: `Forbidden file pattern found: ${issue.file} (${issue.description})` });
      }
    } else {
      success('No forbidden file patterns found');
    }
  } catch (err) {
    issues.push({ type: 'error', message: `Failed to scan dist/: ${err.message}` });
  }
  
  return issues;
}

/**
 * Check for forbidden file patterns in a directory (recursive)
 */
async function checkForbiddenPatterns(dirPath) {
  const issues = [];
  
  try {
    const entries = await readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const name = entry.name.toLowerCase();
      const fullPath = join(dirPath, entry.name);
      
      // Check file patterns
      for (const { pattern, description } of FORBIDDEN_PATTERNS) {
        const patternLower = pattern.toLowerCase();
        
        if (name.endsWith(patternLower) || 
            (pattern.endsWith('/') && entry.isDirectory() && name === pattern.slice(0, -1))) {
          issues.push({ file: fullPath, description });
        }
        
        // Recursively check subdirectories (but not node_modules)
        if (entry.isDirectory() && name !== 'node_modules') {
          const subIssues = await checkForbiddenPatterns(fullPath);
          issues.push(...subIssues);
        }
      }
    }
  } catch (err) {
    error(`Failed to scan ${dirPath}: ${err.message}`);
  }
  
  return issues;
}

/**
 * Check that development folders exist in root (sanity check)
 */
async function checkDevFolders() {
  const issues = [];
  
  info('\nVerifying development metadata folders exist...');
  
  for (const folder of FORBIDDEN_FOLDERS) {
    const folderPath = join(rootDir, folder);
    if (await exists(folderPath)) {
      info(`  ${folder}/ exists in root (expected for development)`);
    }
  }
  
  return issues;
}

/**
 * Main validation function - runs all checks in parallel
 */
async function runValidation() {
  const startTime = performance.now();
  
  info('Validating clean build configuration...\n');
  
  // Run all independent checks in parallel
  const [npmIgnoreIssues, distIssues, devFolderIssues] = await Promise.all([
    checkNpmIgnore(),
    checkDistFolder(),
    checkDevFolders(),
  ]);
  
  // Collect all issues
  const allIssues = [...npmIgnoreIssues, ...distIssues, ...devFolderIssues];
  const hasErrors = allIssues.some(issue => issue.type === 'error');
  const hasWarnings = allIssues.some(issue => issue.type === 'warn');
  
  // Print warnings
  if (hasWarnings) {
    const warnings = allIssues.filter(issue => issue.type === 'warn');
    for (const warning of warnings) {
      warn(warning.message);
    }
  }
  
  // Print errors
  if (hasErrors) {
    const errors = allIssues.filter(issue => issue.type === 'error');
    for (const err of errors) {
      error(err.message);
    }
  }
  
  // Summary
  const endTime = performance.now();
  const duration = (endTime - startTime).toFixed(2);
  
  log('\n' + '='.repeat(50));
  log(`Validation completed in ${duration}ms`);
  log('='.repeat(50));
  
  if (!hasErrors) {
    success('Clean build validation PASSED');
    log('Ready for publication! 🚀');
    return 0;
  } else {
    error('Clean build validation FAILED');
    log('Please fix the issues above before publishing.');
    log('\nCommon fixes:');
    log('  - Ensure .npmignore contains all required entries');
    log('  - Run "npm run build" to create dist/');
    log('  - Verify no dev folders are copied to dist/');
    return 1;
  }
}

// Run validation
runValidation()
  .then(exitCode => process.exit(exitCode))
  .catch(err => {
    error(`Unexpected error: ${err.message}`);
    process.exit(1);
  });
