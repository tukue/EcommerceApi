/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '@shared/(.*)': '<rootDir>/shared/$1',
    '@/(.*)': '<rootDir>/client/src/$1',
    '@server/(.*)': '<rootDir>/server/$1',
    '@tests/(.*)': '<rootDir>/tests/$1',
    '@assets/(.*)': '<rootDir>/attached_assets/$1',
  },
  testMatch: [
    '**/tests/**/*.spec.ts',
    '**/tests/**/*.test.ts'
  ],
  extensionsToTreatAsEsm: ['.ts'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  verbose: true,
  testTimeout: 10000,
  collectCoverage: true,
  collectCoverageFrom: [
    'server/services/**/*.ts',
    'server/integration/**/*.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: 'coverage',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      useESM: true,
    }],
  },
};