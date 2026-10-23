import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyJunit, verifyCoverage, verifyEvidence } from './verify-evidence.mjs';

const xml =
  '<testsuites><testsuite tests="1" failures="0" errors="0" skipped="0"><testcase name="works" /></testsuite></testsuites>';
test('accepts nonempty successful XML', () => assert.equal(verifyJunit(xml, 'unit'), 1));
test('rejects a removed required suite even when remaining XML is green', () => {
  assert.throws(
    () => verifyJunit(xml, 'integration', ['Required PostgreSQL barrier suite']),
    /required suite missing/,
  );
});
test('rejects malformed XML', () => assert.throws(() => verifyJunit('<testsuite>', 'unit')));
test('rejects empty report and inconsistent counts', () => {
  assert.throws(() => verifyJunit('<testsuites/>', 'unit'));
  assert.throws(() => verifyJunit(xml.replace('tests="1"', 'tests="2"'), 'unit'));
});
test('rejects skipped and failed cases regardless of aggregate counters', () => {
  for (const state of ['skipped', 'failure', 'error'])
    assert.throws(() =>
      verifyJunit(
        xml.replace('<testcase name="works" />', `<testcase name="works"><${state}/></testcase>`),
        'unit',
      ),
    );
});
test('rejects DTD/entity documents', () =>
  assert.throws(() => verifyJunit(`<!DOCTYPE testsuites>${xml}`, 'unit')));
test('enforces both nonempty coverage thresholds', () => {
  verifyCoverage(
    { total: { lines: { total: 10, pct: 80 }, branches: { total: 10, pct: 70 } } },
    'backend',
  );
  for (const pct of [69, NaN])
    assert.throws(() =>
      verifyCoverage(
        { total: { lines: { total: 10, pct: 90 }, branches: { total: 10, pct } } },
        'backend',
      ),
    );
  assert.throws(() => verifyCoverage({ total: {} }, 'backend'));
});
test('rejects stale commit, missing required suites and cancelled jobs', () => {
  assert.throws(() => verifyEvidence({ commit: 'old' }, '.', 'new'));
  assert.throws(() => verifyEvidence({ commit: 'new', suites: [] }, '.', 'new'));
  assert.throws(() =>
    verifyEvidence(
      {
        commit: 'new',
        suites: ['unit', 'integration', 'contract'].map((name) => ({ name, status: 'cancelled' })),
      },
      '.',
      'new',
    ),
  );
});
