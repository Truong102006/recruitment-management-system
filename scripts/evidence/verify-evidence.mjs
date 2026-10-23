import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

export function verifyJunit(xml, label, requiredSuites = []) {
  if (XMLValidator.validate(xml) !== true || /<!DOCTYPE|<!ENTITY/i.test(xml)) {
    throw new Error(`${label}: invalid or unsafe XML`);
  }
  const parsed = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '',
    isArray: (name) => ['testsuite', 'testcase'].includes(name),
  }).parse(xml);
  const suites = parsed.testsuites?.testsuite ?? parsed.testsuite;
  if (!Array.isArray(suites) || suites.length === 0) throw new Error(`${label}: no suites`);
  for (const name of requiredSuites) {
    if (!suites.some((suite) => suite.name === name))
      throw new Error(`${label}: required suite missing: ${name}`);
  }
  let total = 0;
  for (const suite of suites) {
    const cases = suite.testcase ?? [];
    if (
      !Number.isInteger(Number(suite.tests)) ||
      Number(suite.tests) <= 0 ||
      Number(suite.tests) !== cases.length
    )
      throw new Error(`${label}: empty or inconsistent suite`);
    for (const key of ['failures', 'errors', 'skipped']) {
      if (suite[key] !== undefined && Number(suite[key]) !== 0) throw new Error(`${label}: ${key}`);
    }
    for (const test of cases) {
      if (['failure', 'error', 'skipped'].some((key) => Object.hasOwn(test, key)))
        throw new Error(`${label}: failed or skipped testcase`);
    }
    total += cases.length;
  }
  return total;
}

export function verifyCoverage(summary, label) {
  for (const [metric, minimum] of [
    ['lines', 80],
    ['branches', 70],
  ]) {
    const value = summary.total?.[metric];
    if (!value || value.total <= 0 || !Number.isFinite(value.pct) || value.pct < minimum)
      throw new Error(`${label}: ${metric} below ${minimum}% or empty`);
  }
}

export function scanTests(root) {
  for (const item of readdirSync(root, { withFileTypes: true })) {
    if (['node_modules', 'reports', '.git', 'dist'].includes(item.name)) continue;
    const path = join(root, item.name);
    if (item.isDirectory()) scanTests(path);
    else if (/\.(spec|test)\.[cm]?[jt]sx?$/.test(item.name)) {
      const source = readFileSync(path, 'utf8');
      if (
        /\b(?:describe|it|test)\s*(?:\.\s*(?:only|skip|todo)|\[\s*['"](?:only|skip|todo)['"]\s*\])|\b(?:fdescribe|fit|xdescribe|xit|xtest)\s*\(/.test(
          source,
        )
      )
        throw new Error(`${path}: focused/skipped/pending test`);
    }
  }
}

export function verifyEvidence(manifest, root, expectedCommit) {
  if (!expectedCommit || manifest.commit !== expectedCommit)
    throw new Error('Evidence commit does not match current commit');
  if (!Array.isArray(manifest.suites) || manifest.suites.length === 0)
    throw new Error('Required suites missing');
  const required = ['unit', 'integration', 'contract'];
  const inventory = JSON.parse(
    readFileSync(resolve(root, 'scripts/evidence/required-suites.json'), 'utf8'),
  );
  for (const name of required) {
    const entries = manifest.suites.filter((suite) => suite.name === name);
    if (entries.length !== 1) throw new Error(`Required suite ${name} missing or duplicated`);
  }
  for (const suite of manifest.suites) {
    if (suite.status !== 'success') throw new Error(`${suite.name}: job not successful`);
    const expected = inventory[suite.name];
    if (!Array.isArray(expected) || !expected.length)
      throw new Error(`${suite.name}: required inventory missing`);
    for (const entry of expected) readFileSync(resolve(root, entry.file), 'utf8');
    verifyJunit(
      readFileSync(resolve(root, suite.junit), 'utf8'),
      suite.name,
      expected.map((entry) => entry.suite),
    );
  }
  verifyCoverage(JSON.parse(readFileSync(resolve(root, manifest.coverage), 'utf8')), 'backend');
  scanTests(resolve(root, 'apps'));
  scanTests(resolve(root, 'libs'));
  scanTests(resolve(root, 'tests'));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const manifest = JSON.parse(
      readFileSync(process.argv[2] ?? 'reports/backend/evidence.json', 'utf8'),
    );
    verifyEvidence(manifest, process.cwd(), process.env.GITHUB_SHA ?? process.env.EVIDENCE_COMMIT);
    console.log(
      'BE evidence verified (unit/integration/contract + backend coverage). FE/E2E and operational acceptance are separate required evidence.',
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
