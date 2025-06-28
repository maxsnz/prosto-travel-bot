#!/usr/bin/env node

import { cacheManager } from "./services";

// CLI argument parsing
const args = process.argv.slice(2);
const command = args[0];

async function main() {
  try {
    switch (command) {
      case "cache:clear":
        await clearCache();
        break;

      case "cache:info":
        await showCacheInfo();
        break;

      case "cache:health":
        await checkCacheHealth();
        break;

      case "cache:stats":
        await showCacheStats();
        break;

      case "cache:clear-pattern":
        const pattern = args[1];
        if (!pattern) {
          console.error(
            "Pattern is required. Usage: npm run cli cache:clear-pattern <pattern>"
          );
          await cacheManager.close();
          process.exit(1);
        }
        await clearCacheByPattern(pattern);
        break;

      default:
        showHelp();
        break;
    }
    await cacheManager.close();
    process.exit(0);
  } catch (error) {
    console.error("CLI Error:", error);
    await cacheManager.close();
    process.exit(1);
  }
}

async function clearCache() {
  console.log("Clearing all cache...");
  await cacheManager.clear();
  console.log("All cache cleared successfully!");
}

async function showCacheInfo() {
  console.log("Cache Information:");
  const info = await cacheManager.getCacheInfo();
  console.log(`Type: ${info.type === "redis" ? "Redis" : "Memory"}`);
  console.log(`Size: ${info.stats.size} entries`);
  console.log(`Memory: ${info.stats.memory}`);
  console.log(
    `Keys: ${info.stats.keys.length > 0 ? info.stats.keys.join(", ") : "none"}`
  );
}

async function checkCacheHealth() {
  console.log("Checking cache health...");
  const isHealthy = await cacheManager.healthCheck();
  if (isHealthy) {
    console.log("Cache is healthy!");
  } else {
    console.log("Cache health check failed!");
    process.exit(1);
  }
}

async function showCacheStats() {
  console.log("Cache Statistics:");
  const stats = await cacheManager.getStats();
  console.log(`Total entries: ${stats.size}`);
  console.log(`Memory usage: ${stats.memory}`);
  console.log(`Cache type: ${cacheManager.getCacheType()}`);
}

async function clearCacheByPattern(pattern: string) {
  console.log(`Clearing cache with pattern: ${pattern}`);
  const cleared = await cacheManager.clearByPattern(pattern);
  console.log(`Cleared ${cleared} cache entries matching pattern "${pattern}"`);
}

function showHelp() {
  console.log(`
Prosto Travel Bot CLI

Usage: npm run cli <command>

Cache Commands:
  cache:clear              Clear all cache
  cache:info               Show cache information
  cache:health             Check cache health
  cache:stats              Show cache statistics
  cache:clear-pattern      Clear cache by pattern (e.g., "cities:*")

Examples:
  npm run cli cache:clear
  npm run cli cache:info
  npm run cli cache:clear-pattern "cities:*"
  npm run cli cache:clear-pattern "places:*"
`);
}

// Run CLI
main();
