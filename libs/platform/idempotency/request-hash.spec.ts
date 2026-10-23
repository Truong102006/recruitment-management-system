import { hashRequest } from './request-hash';

describe('idempotency request fingerprint', () => {
  it('ignores JSON object key order but preserves target, operation, version and payload', () => {
    const hash = hashRequest('application.review', 'application-a', {
      version: 0,
      status: 'SCREENING',
    });
    expect(hash).toHaveLength(64);
    expect(
      hashRequest('application.review', 'application-a', { status: 'SCREENING', version: 0 }),
    ).toBe(hash);
    expect(
      hashRequest('application.review', 'application-b', { version: 0, status: 'SCREENING' }),
    ).not.toBe(hash);
    expect(
      hashRequest('application.withdraw', 'application-a', { version: 0, status: 'SCREENING' }),
    ).not.toBe(hash);
    expect(
      hashRequest('application.review', 'application-a', { version: 1, status: 'SCREENING' }),
    ).not.toBe(hash);
  });
  it('preserves array order, strings and null without silently normalizing the DTO', () => {
    expect(hashRequest('op', 'id', [1, 2])).not.toBe(hashRequest('op', 'id', [2, 1]));
    expect(hashRequest('op', 'id', ' x ')).not.toBe(hashRequest('op', 'id', 'x'));
    expect(hashRequest('op', 'id', null)).not.toBe(hashRequest('op', 'id', {}));
    expect(hashRequest('op', 'id', true)).not.toBe(hashRequest('op', 'id', false));
  });
  it.each([undefined, NaN, Infinity, BigInt(1), new Date(), { value: undefined }, [undefined]])(
    'refuses non-JSON input instead of hashing an ambiguous body (%p)',
    (input) => expect(() => hashRequest('op', 'id', input)).toThrow(TypeError),
  );
  it('rejects cycles but supports repeated non-circular references', () => {
    const obj: { child?: unknown } = {};
    obj.child = obj;
    expect(() => hashRequest('op', 'id', obj)).toThrow('Circular');
    const child = { key: 'value' };
    expect(hashRequest('op', 'id', { a: child, b: child })).toBe(
      hashRequest('op', 'id', { a: { key: 'value' }, b: { key: 'value' } }),
    );
    const dict = Object.create(null) as Record<string, unknown>;
    dict['key'] = 'value';
    expect(hashRequest('op', 'id', dict)).toBe(hashRequest('op', 'id', child));
  });
});
