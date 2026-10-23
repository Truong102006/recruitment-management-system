module.exports = {
  ...require('./jest.config.cjs'),
  testMatch: [
    '**/tests/integration/**/*.spec.ts',
    '**/tests/api/**/*.spec.ts',
    '**/tests/concurrency/**/*.spec.ts',
    '**/tests/contract/**/*.spec.ts',
  ],
  collectCoverage: false,
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: 'reports/backend/integration', outputName: 'junit.xml' }],
  ],
};
