module.exports = {
  testEnvironment: 'node',
  testMatch: ['<rootDir>/apps/api/src/**/*.spec.ts', '<rootDir>/apps/worker/src/**/*.spec.ts', '<rootDir>/libs/**/*.spec.ts'],
  transform: { '^.+\\.tsx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.backend.json' }] },
  collectCoverageFrom: ['apps/api/src/**/*.ts', 'apps/worker/src/**/*.ts', 'libs/**/*.ts', '!**/*.spec.ts', '!**/*.d.ts', '!**/main.ts', '!**/*.module.ts'],
  coverageDirectory: '<rootDir>/reports/backend/coverage',
  coverageReporters: ['text', 'lcov', 'json-summary'],
  coverageThreshold: { global: { lines: 80, branches: 70 } },
  reporters: ['default', ['jest-junit', { outputDirectory: 'reports/backend/unit', outputName: 'junit.xml' }]],
};
