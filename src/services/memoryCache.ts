interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface CacheConfig {
  defaultTtl?: number; // in milliseconds
  maxSize?: number;
}

export class MemoryCacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private config: Required<CacheConfig>;

  constructor(config: CacheConfig = {}) {
    this.config = {
      defaultTtl: 5 * 60 * 1000, // 5 minutes by default
      maxSize: 1000,
      ...config,
    };
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    // Clean up expired entries
    this.cleanup();

    // Check cache size
    if (this.cache.size >= this.config.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.defaultTtl,
    };

    this.cache.set(key, entry);
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    // Check if TTL has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  async has(key: string): Promise<boolean> {
    return this.get(key) !== null;
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }

  async size(): Promise<number> {
    this.cleanup();
    return this.cache.size;
  }

  // Get cache statistics
  async getStats(): Promise<{
    size: number;
    memory: string;
    keys: string[];
  }> {
    this.cleanup();
    const keys = Array.from(this.cache.keys());

    // Estimate memory usage (rough calculation)
    const estimatedMemory = this.cache.size * 1024; // ~1KB per entry
    const memoryInMB = (estimatedMemory / (1024 * 1024)).toFixed(2);

    return {
      size: keys.length,
      memory: `${memoryInMB}MB`,
      keys,
    };
  }

  // Clear cache by pattern
  async clearByPattern(pattern: string): Promise<number> {
    const regex = new RegExp(pattern.replace(/\*/g, ".*"));
    let deletedCount = 0;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }

    return deletedCount;
  }

  // Close method for compatibility with Redis
  async close(): Promise<void> {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// Create global memory cache instance
export const memoryCacheManager = new MemoryCacheManager({
  defaultTtl: 10 * 60 * 1000, // 10 minutes
  maxSize: 500,
});
