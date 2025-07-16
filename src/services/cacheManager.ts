import env from "../config/env";
import { redisCacheManager } from "./redisCache";
import { memoryCacheManager } from "./memoryCache";

// Cache interface that both implementations follow
export interface ICacheManager {
  set<T>(key: string, data: T, ttl?: number): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  has(key: string): Promise<boolean>;
  delete(key: string): Promise<boolean>;
  clear(): Promise<void>;
  size(): Promise<number>;
  getStats(): Promise<{
    size: number;
    memory: string;
    keys: string[];
  }>;
  clearByPattern(pattern: string): Promise<number>;
  close(): Promise<void>;
}

export class CacheManager implements ICacheManager {
  private cache: ICacheManager;
  private cacheType: "redis" | "memory";

  constructor() {
    // Choose cache implementation based on REDIS_URL
    if (env.REDIS_URL) {
      this.cache = redisCacheManager;
      this.cacheType = "redis";
    } else {
      this.cache = memoryCacheManager;
      this.cacheType = "memory";
    }
  }

  // Get current cache type
  getCacheType(): "redis" | "memory" {
    return this.cacheType;
  }

  // Delegate all methods to the chosen implementation
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    return this.cache.set(key, data, ttl);
  }

  async get<T>(key: string): Promise<T | null> {
    return this.cache.get<T>(key);
  }

  async has(key: string): Promise<boolean> {
    return this.cache.has(key);
  }

  async delete(key: string): Promise<boolean> {
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
    return this.cache.clear();
  }

  async size(): Promise<number> {
    return this.cache.size();
  }

  async getStats(): Promise<{
    size: number;
    memory: string;
    keys: string[];
  }> {
    return this.cache.getStats();
  }

  async clearByPattern(pattern: string): Promise<number> {
    return this.cache.clearByPattern(pattern);
  }

  async close(): Promise<void> {
    return this.cache.close();
  }

  // Additional utility methods
  async getCacheInfo(): Promise<{
    type: "redis" | "memory";
    stats: {
      size: number;
      memory: string;
      keys: string[];
    };
  }> {
    const stats = await this.getStats();
    return {
      type: this.cacheType,
      stats,
    };
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const testKey = "__health_check__";
      const testData = { timestamp: Date.now() };

      await this.set(testKey, testData, 1000); // 1 second TTL
      const retrieved = await this.get<{ timestamp: number }>(testKey);
      await this.delete(testKey);

      return retrieved !== null && retrieved.timestamp === testData.timestamp;
    } catch (error) {
      console.error("Cache health check failed:", error);
      return false;
    }
  }
}

// Create global cache manager instance
export const cacheManager = new CacheManager();
