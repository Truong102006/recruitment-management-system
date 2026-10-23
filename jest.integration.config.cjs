module.exports = {
  ...require('./jest.config.cjs'),
  testMatch: [
    '<rootDir>/tests/integration/**/*.spec.ts',
    '<rootDir>/tests/api/**/*.spec.ts',
    '<rootDir>/tests/concurrency/**/*.spec.ts',
    '<rootDir>/tests/contract/**/*.spec.ts',
  ],
  collectCoverage: false,
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'reports/backend/integration', outputName: 'junit.xml' }],
  ],
};
