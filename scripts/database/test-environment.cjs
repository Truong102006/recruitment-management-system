const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { parseEnv } = require('node:util');

// All backend Jest configs inherit this setup, before importing Prisma or Nest.
const root = resolve(__dirname, '../..');
const testFile = resolve(root, '.env.test');
const fallbackFile = resolve(root, '.env');
const testValues = existsSync(testFile) ? parseEnv(readFileSync(testFile, 'utf8')) : {};
const fallbackValues = existsSync(fallbackFile) ? parseEnv(readFileSync(fallbackFile, 'utf8')) : {};
const selected =
  process.env.TEST_DATABASE_URL ||
  testValues.DATABASE_URL ||
  process.env.DATABASE_URL ||
  fallbackValues.TEST_DATABASE_URL ||
  fallbackValues.DATABASE_URL;

if (selected) {
  let host;
  try {
    host = new URL(selected).hostname;
  } catch {
    throw new Error('Invalid test database URL; credentials omitted');
  }
  if (!['localhost', '127.0.0.1', '[::1]', '::1'].includes(host)) {
    throw new Error(
      'Backend tests require a local PostgreSQL database. Configure TEST_DATABASE_URL or .env.test; shared cloud databases are not allowed.',
    );
  }
  process.env.DATABASE_URL = selected;
}
process.env.NODE_ENV = 'test';
