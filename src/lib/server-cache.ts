type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

type CacheResult<T> = {
  hit: boolean;
  stale: boolean;
  staleReason?: string;
  ttlSeconds: number;
  value: T;
};

const cache = new Map<string, CacheEntry<unknown>>();

export async function getCached<T>(
  key: string,
  ttlSeconds: number,
  load: () => Promise<T>,
): Promise<CacheResult<T>> {
  const now = Date.now();
  const existing = cache.get(key) as CacheEntry<T> | undefined;

  if (existing && existing.expiresAt > now) {
    return {
      hit: true,
      stale: false,
      ttlSeconds: Math.max(0, Math.ceil((existing.expiresAt - now) / 1000)),
      value: existing.value,
    };
  }

  let value: T;
  try {
    value = await load();
  } catch (error) {
    if (existing) {
      return {
        hit: true,
        stale: true,
        staleReason: error instanceof Error ? error.message : "Live data refresh failed",
        ttlSeconds: 0,
        value: existing.value,
      };
    }

    throw error;
  }

  cache.set(key, {
    expiresAt: now + ttlSeconds * 1000,
    value,
  });

  return {
    hit: false,
    stale: false,
    ttlSeconds,
    value,
  };
}

export function createCacheKey(parts: Array<number | string>) {
  return parts.map((part) => encodeURIComponent(String(part))).join(":");
}
