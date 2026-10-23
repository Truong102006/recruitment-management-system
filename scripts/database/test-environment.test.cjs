const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');
const setup = resolve(__dirname, 'test-environment.cjs');

function run(url) {
  return spawnSync(
    process.execPath,
    [
      '-e',
      'require(process.argv[1]); console.log(new URL(process.env.DATABASE_URL).hostname)',
      setup,
    ],
    {
      env: {
        ...process.env,
        TEST_DATABASE_URL: url,
        DATABASE_URL: 'postgresql://fixture:fixture@shared.example.test/db',
      },
      encoding: 'utf8',
    },
  );
}
test('test database overrides the cloud runtime database', () => {
  const result = run('postgresql://fixture:fixture@127.0.0.1:5432/test');
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), '127.0.0.1');
});
test('shared cloud databases are rejected before tests start', () => {
  const result = run('postgresql://fixture:fixture@shared.example.test/test');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /shared cloud databases are not allowed/);
  assert.doesNotMatch(result.stderr, /postgresql:\/\//);
});
test('malformed URLs fail without printing the configured value', () => {
  const result = run('invalid-private-value');
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /Invalid test database URL/);
  assert.doesNotMatch(result.stderr, /invalid-private-value/);
});
