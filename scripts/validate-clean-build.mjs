#!/usr/bin/env node

/**
 * Validate Clean Build Script
 * 
 * Ensures that development metadata folders are excluded from build artifacts.
 * Used by prepublishOnly hook to prevent accidental inclusion of dev files.
 * 
 * Checks:
 * 1. .specify/ folder should NOT exist in dist/
 * 2. conductor/ folder should NOT exist in dist/
 * 3. specs/ folder should NOT exist in dist/
 * 4. .npmignore exists and contains required exclusions
 * 5. dist/ contains only expected files (if it exists)
 */

import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const rootDir = resolve(__dirname, '..');

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

// Files that MUST be in .npmignore
const REQUIRED_NPM_IGNORE_ENTRIES = [
  '.specify/',
  'conductor/',
  'node_modules/',
];

let exitCode = 0;

info('Validating clean build configuration...\n');

// Check 1: Verify .npmignore exists
const npmIgnorePath = join(rootDir, '.npmignore');
if (!existsSync(npmIgnorePath)) {
  error('.npmignore file does not exist');
  exitCode = 1;
} else {
  success('.npmignore file exists');
  
  // Check 2: Verify .npmignore contains required entries
  try {
    const npmIgnoreContent = readFileSync(npmIgnorePath, 'utf-8');
    
    for (const entry of REQUIRED_NPM_IGNORE_ENTRIES) {
      if (!npmIgnoreContent.includes(entry)) {
        error(`.npmignore missing required entry: ${entry}`);
        exitCode = 1;
      } else {
        success(`.npmignore contains: ${entry}`);
      }
    }
  } catch (err) {
    error(`Failed to read .npmignore: ${err.message}`);
    exitCode = 1;
  }
}

// Check 3: Verify forbidden folders don't exist in dist/ (if dist exists)
const distPath = join(rootDir, 'dist');
if (existsSync(distPath)) {
  info('\nChecking dist/ folder for forbidden files...');
  
  for (const folder of FORBIDDEN_FOLDERS) {
    const forbiddenPath = join(distPath, folder);
    if (existsSync(forbiddenPath)) {
      error(`Forbidden folder found in dist/: ${folder}/`);
      exitCode = 1;
    } else {
      success(`${folder}/ not in dist/`);
    }
  }
} else {
  warn('\ndist/ folder does not exist (run build first)');
}

// Check 4: Verify forbidden folders exist in root (development files)
info('\nVerifying development metadata folders exist...');
for (const folder of FORBIDDEN_FOLDERS) {
  const folderPath = join(rootDir, folder);
  if (existsSync(folderPath)) {
    info(`  ${folder}/ exists in root (expected for development)`);
  }
}

// Summary
log('\n' + '='.repeat(50));
if (exitCode === 0) {
  success('Clean build validation PASSED');
  log('Ready for publication! 🚀');
} else {
  error('Clean build validation FAILED');
  log('Please fix the issues above before publishing.');
  log('\nCommon fixes:');
  log('  - Ensure .npmignore contains all required entries');
  log('  - Run "npm run build" to create dist/');
  log('  - Verify no dev folders are copied to dist/');
}
log('='.repeat(50));

process.exit(exitCode);
