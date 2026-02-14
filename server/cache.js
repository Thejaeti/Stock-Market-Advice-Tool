const cache = new Map();

const DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes

export function get(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export function set(key, value, ttl = DEFAULT_TTL) {
  cache.set(key, { value, expiresAt: Date.now() + ttl });
}

export function clear() {
  cache.clear();
}
