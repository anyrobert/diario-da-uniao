import { exists } from "../helpers/exists.ts";

export const CACHE_DIR = "_cache";

try {
  Deno.mkdirSync(CACHE_DIR);
} catch (e) {
  if (e.code === "EEXIST") {
    console.log(`Cache directory ${CACHE_DIR} already exists`);
  } else {
    Deno.exit(1);
  }
}

export class Cache {
  constructor() {}

  async get<T>(key: string): Promise<T | null> {
    const cacheFile = `${CACHE_DIR}/${key}.json`;
    const hasCache = await exists(cacheFile);

    if (!hasCache) {
      return null;
    }

    const cache = await Deno.readTextFile(cacheFile);
    try {
      return JSON.parse(cache) as T;
    } catch (e) {
      console.error(`Error parsing cache file ${cacheFile}: ${e}`);
      return null;
    }
  }

  async set<T>(key: string, value: T) {
    const cacheFile = `${CACHE_DIR}/${key}.json`;
    await Deno.writeTextFile(cacheFile, JSON.stringify(value));
  }
}

export function withCache<T>(fn: (...args: any[]) => Promise<T>, key: string) {
  return async (...args: any[]) => {
    const cache = new Cache();
    const cachedValue = await cache.get<T>(key);

    if (cachedValue) {
      return cachedValue;
    }

    const result = await fn(...args);
    await cache.set(key, result);
    return result;
  };
}
