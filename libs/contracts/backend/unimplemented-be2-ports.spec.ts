import { PORTS } from './index';
import { unimplementedBe2Ports, UnimplementedPortError } from './unimplemented-be2-ports';

it('fails closed for every placeholder method; none can grant permissions or fabricate success', async () => {
  for (const port of Object.values(unimplementedBe2Ports())) {
    for (const method of Object.values(port)) {
      await expect(Reflect.apply(method, undefined, [])).rejects.toBeInstanceOf(
        UnimplementedPortError,
      );
      await expect(Reflect.apply(method, undefined, [])).rejects.toMatchObject({
        code: 'DEPENDENCY_UNAVAILABLE',
      });
    }
  }
});

it('has distinct DI tokens so providers from different BE owners cannot overwrite each other', () => {
  expect(new Set(Object.values(PORTS)).size).toBe(Object.keys(PORTS).length);
});
