module.exports = {
  ...require('./jest.config.cjs'),
  testMatch: ['**/tests/contract/**/*.spec.ts'],
  collectCoverage: false,
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'reports/backend/contract',
        outputName: 'junit.xml',
      },
    ],
  ],
};
