import { ConfigService } from '@nestjs/config';
import { AnalyticsCacheService } from './analytics-cache.service';

const makeService = (redisUrl?: string) => {
  const config = { get: jest.fn().mockReturnValue(redisUrl) } as unknown as ConfigService;
  const svc = new AnalyticsCacheService(config);
  return svc;
};

describe('AnalyticsCacheService', () => {
  it('is disabled when no REDIS_URL', () => {
    const svc = makeService(undefined);
    svc.onModuleInit();
    expect(svc.isEnabled).toBe(false);
  });

  describe('when disabled', () => {
    let svc: AnalyticsCacheService;

    beforeEach(() => {
      svc = makeService(undefined);
      svc.onModuleInit();
    });

    it('get returns null', async () => {
      expect(await svc.get('any-key')).toBeNull();
    });

    it('set is a no-op', async () => {
      await expect(svc.set('key', { x: 1 }, 60)).resolves.toBeUndefined();
    });

    it('del is a no-op', async () => {
      await expect(svc.del('key')).resolves.toBeUndefined();
    });

    it('getOrSet calls factory and returns result', async () => {
      const factory = jest.fn().mockResolvedValue({ data: 42 });
      const result = await svc.getOrSet('key', factory, 60);
      expect(factory).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ data: 42 });
    });

    it('invalidatePattern is a no-op', async () => {
      await expect(svc.invalidatePattern('analytics:*')).resolves.toBeUndefined();
    });
  });

  describe('buildKey', () => {
    it('prefixes with analytics:', () => {
      const svc = makeService(undefined);
      expect(svc.buildKey('seller', 'abc', 'dashboard')).toBe('analytics:seller:abc:dashboard');
    });

    it('joins single part', () => {
      const svc = makeService(undefined);
      expect(svc.buildKey('platform')).toBe('analytics:platform');
    });
  });
});
