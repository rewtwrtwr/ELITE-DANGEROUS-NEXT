/** @type {import('jest').Config} */
export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  
  // Extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  
  // Test matching
  testMatch: ['**/__tests__/**/*.test.ts'],
  
  // Coverage
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/client/**',
    '!src/__tests__/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
  
  // ESM support
  extensionsToTreatAsEsm: ['.ts'],
  
  // Transform
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'ESNext',
          moduleResolution: 'node',
        },
      },
    ],
  },
  
  // Setup
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  
  // Module name mapper (for aliases and ESM)
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Force exit (prevent hanging)
  forceExit: true,
  detectOpenHandles: true,
  
  // Reporters
  reporters: ['default'],
};
