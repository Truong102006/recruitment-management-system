module.exports = {
  ...require('./jest.config.cjs'),
  testMatch: ['<rootDir>/tests/{integration,api,concurrency,contract}/**/*.spec.ts'],
  collectCoverage: false,
  reporters: ['default', ['jest-junit', { outputDirectory: 'reports/backend/integration', outputName: 'junit.xml' }]],
};
