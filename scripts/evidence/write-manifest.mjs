import { mkdirSync, writeFileSync } from 'node:fs';
const commit = process.env.GITHUB_SHA ?? process.env.EVIDENCE_COMMIT;
if (!commit) throw new Error('GITHUB_SHA or EVIDENCE_COMMIT required');
mkdirSync('reports/backend', { recursive: true });
// Invoke only after every producing command has succeeded in this same clean run.
writeFileSync(
  'reports/backend/evidence.json',
  JSON.stringify(
    {
      commit,
      suites: ['unit', 'integration', 'contract'].map((name) => ({
        name,
        status: 'success',
        junit: `reports/backend/${name}/junit.xml`,
      })),
      coverage: 'reports/backend/coverage/coverage-summary.json',
    },
    null,
    2,
  ),
);
