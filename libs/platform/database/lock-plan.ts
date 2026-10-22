export const LOCK_TABLES = [
  'user_account',
  'company',
  'job_post',
  'application',
  'interview',
  'cv_version',
] as const;
export type LockTable = (typeof LOCK_TABLES)[number];
export interface LockTarget {
  readonly table: LockTable;
  readonly id: string;
}

/**
 * Pure plan, NOT SQL locking. Caller gathers all IDs before acquiring locks,
 * then verifies scope again under locks (Word §4.4).
 */
export function planLocks(targets: readonly LockTarget[]): readonly LockTarget[] {
  const groups = new Map<LockTable, Set<string>>(LOCK_TABLES.map((table) => [table, new Set()]));
  for (const target of targets) {
    const group = groups.get(target.table);
    if (!group || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(target.id)) {
      throw new TypeError('Invalid lock table or UUID');
    }
    group.add(target.id.toLowerCase());
  }
  return Object.freeze(
    LOCK_TABLES.flatMap((table) =>
      [...groups.get(table)!].sort().map((id) => Object.freeze({ table, id })),
    ),
  );
}
