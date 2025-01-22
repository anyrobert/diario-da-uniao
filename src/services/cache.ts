import { CacheService } from "../types/index.ts";
import { config } from "../config/config.ts";

export class FileSystemCache implements CacheService {
  private readonly cacheDir: string;

  constructor(cacheDir = config.cacheDir) {
    this.cacheDir = cacheDir;
  }

  private getCachePath(key: string): string {
    return `${this.cacheDir}/${key}.json`;
  }

  async get<T>(key: string): Promise<T | null> {
    const path = this.getCachePath(key);
    
    try {
      const content = await Deno.readTextFile(path);
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    const path = this.getCachePath(key);
    
    try {
      await Deno.mkdir(this.cacheDir, { recursive: true });
      await Deno.writeTextFile(path, JSON.stringify(value, null, 2));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to cache data: ${message}`);
    }
  }
} 