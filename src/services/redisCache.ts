import IORedis from "ioredis";
import env from "../config/env";

interface CacheConfig {
  defaultTtl?: number; // in milliseconds
  keyPrefix?: string;
}

export class RedisCacheManager {
  private redis: IORedis;
  private config: Required<CacheConfig>;

  constructor(config: CacheConfig = {}) {
    this.config = {
      defaultTtl: 5 * 60 * 1000, // 5 minutes by default
      keyPrefix: "cache:",
      ...config,
    };

    this.redis = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
    });

    this.redis.on("error", (error) => {
      console.error("Redis connection error:", error);
    });

    this.redis.on("connect", () => {
      console.log("✅ Redis connected successfully");
    });
  }

  private getKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    try {
      const redisKey = this.getKey(key);
      const serializedData = JSON.stringify(data);
      const ttlSeconds = Math.ceil((ttl || this.config.defaultTtl) / 1000);

      await this.redis.setex(redisKey, ttlSeconds, serializedData);
    } catch (error) {
      console.error("Redis set error:", error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const redisKey = this.getKey(key);
      const data = await this.redis.get(redisKey);

      if (!data) {
        return null;
      }

      return JSON.parse(data) as T;
    } catch (error) {
      console.error("Redis get error:", error);
      return null;
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const redisKey = this.getKey(key);
      const exists = await this.redis.exists(redisKey);
      return exists === 1;
    } catch (error) {
      console.error("Redis has error:", error);
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const redisKey = this.getKey(key);
      const deleted = await this.redis.del(redisKey);
      return deleted === 1;
    } catch (error) {
      console.error("Redis delete error:", error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const pattern = `${this.config.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(`Cleared ${keys.length} cache entries`);
      }
    } catch (error) {
      console.error("Redis clear error:", error);
      throw error;
    }
  }

  async size(): Promise<number> {
    try {
      const pattern = `${this.config.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);
      return keys.length;
    } catch (error) {
      console.error("Redis size error:", error);
      return 0;
    }
  }

  // Get cache statistics
  async getStats(): Promise<{
    size: number;
    memory: string;
    keys: string[];
  }> {
    try {
      const pattern = `${this.config.keyPrefix}*`;
      const keys = await this.redis.keys(pattern);
      const info = await this.redis.info("memory");

      // Extract used memory from info
      const memoryMatch = info.match(/used_memory_human:(\S+)/);
      const memory = memoryMatch ? memoryMatch[1] : "unknown";

      return {
        size: keys.length,
        memory,
        keys: keys.map((key) => key.replace(this.config.keyPrefix, "")),
      };
    } catch (error) {
      console.error("Redis stats error:", error);
      return {
        size: 0,
        memory: "unknown",
        keys: [],
      };
    }
  }

  // Clear cache by pattern
  async clearByPattern(pattern: string): Promise<number> {
    try {
      const fullPattern = `${this.config.keyPrefix}${pattern}`;
      const keys = await this.redis.keys(fullPattern);

      if (keys.length > 0) {
        await this.redis.del(...keys);
        console.log(
          `Cleared ${keys.length} cache entries matching pattern: ${pattern}`
        );
      }

      return keys.length;
    } catch (error) {
      console.error("Redis clearByPattern error:", error);
      return 0;
    }
  }

  // Close Redis connection
  async close(): Promise<void> {
    try {
      await this.redis.quit();
      console.log("Redis connection closed");
    } catch (error) {
      console.error("Redis close error:", error);
    }
  }
}

// Create global Redis cache instance
export const redisCacheManager = new RedisCacheManager({
  defaultTtl: 10 * 60 * 1000, // 10 minutes
  keyPrefix: "prosto-travel:",
});
