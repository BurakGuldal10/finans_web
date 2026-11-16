type CacheEntry<T> = {
  expiresAt: number;
  staleUntil: number;
  value: T;
};

type CacheResult<T> = {
  hit: boolean;
  stale: boolean;
  staleReason?: string;
  ttlSeconds: number;
  value: T;
};

const MAX_CACHE_ENTRIES = 500;
const STALE_GRACE_MS = 15 * 60 * 1000;
const cache = new Map<string, CacheEntry<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();

function pruneCache(now: number) {
  if (cache.size <= MAX_CACHE_ENTRIES) {
    return;
  }

  for (const [key, entry] of cache.entries()) {
    if (entry.staleUntil <= now) {
      cache.delete(key);
    }
  }

  if (cache.size > MAX_CACHE_ENTRIES) {
    const oldestKeys = Array.from(cache.keys()).slice(0, cache.size - MAX_CACHE_ENTRIES);
    for (const key of oldestKeys) {
      cache.delete(key);
    }
  }
}

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

  let pending = inFlight.get(key) as Promise<T> | undefined;
  if (!pending) {
    pending = load().finally(() => {
      inFlight.delete(key);
    });
    inFlight.set(key, pending);
  }

  try {
    const value = await pending;
    const completedAt = Date.now();
    cache.set(key, {
      expiresAt: completedAt + ttlSeconds * 1000,
      staleUntil: completedAt + ttlSeconds * 1000 + STALE_GRACE_MS,
      value,
    });
    pruneCache(completedAt);

    return {
      hit: false,
      stale: false,
      ttlSeconds,
      value,
    };
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
}

export function createCacheKey(parts: Array<number | string>) {
  return parts.map((part) => encodeURIComponent(String(part))).join(":");
}
