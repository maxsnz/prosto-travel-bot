# Service Architecture

## Overview

The architecture is organized around a service layer that centralizes API work, caching, and data management. The cache system automatically chooses between Redis and in-memory storage based on configuration.

## Structure

```
src/services/
├── api.ts          # Base API client with retry logic and auth
├── cacheManager.ts # Cache abstraction layer
├── redisCache.ts   # Redis-based cache implementation
├── memoryCache.ts  # In-memory cache implementation
├── types.ts        # Common types for API
├── cityService.ts  # Service for working with cities
├── placeService.ts # Service for working with places
└── index.ts        # Export of all services
```

## Main Components

### 1. ApiClient (`api.ts`)

- Centralized HTTP request handling
- Automatic retry with configurable parameters
- Automatic Bearer token authorization
- Support for GET, POST, PUT, DELETE methods
- Uniform error handling

```typescript
import { apiClient } from "./services";

// GET request (automatically includes Authorization header)
const data = await apiClient.request<MyType>("/endpoint");

// POST request with body
const result = await apiClient.post<MyType>("/endpoint", { key: "value" });

// PUT request
const updated = await apiClient.put<MyType>("/endpoint/123", {
  key: "new-value",
});

// DELETE request
await apiClient.delete("/endpoint/123");
```

### 2. CacheManager (`cacheManager.ts`)

- Abstract cache layer that automatically chooses implementation
- Redis if `REDIS_URL` is configured, otherwise in-memory
- Unified interface for all cache operations
- Health checks and monitoring

```typescript
import { cacheManager } from "./services";

// Automatic implementation selection
const cacheType = cacheManager.getCacheType(); // 'redis' | 'memory'

// Unified cache operations
await cacheManager.set("key", data, 5 * 60 * 1000);
const data = await cacheManager.get<MyType>("key");
await cacheManager.clearByPattern("cities:*");

// Health check
const isHealthy = await cacheManager.healthCheck();

// Get cache info
const info = await cacheManager.getCacheInfo();
```

### 3. RedisCacheManager (`redisCache.ts`)

- Redis-based cache implementation
- JSON serialization/deserialization
- Pattern-based cache clearing
- Real memory statistics

### 4. MemoryCacheManager (`memoryCache.ts`)

- In-memory cache implementation
- Automatic cleanup of expired entries
- Size limitations and eviction policies
- Estimated memory usage

### 5. CityService (`cityService.ts`)

- Singleton for working with cities
- Uses abstract cache layer
- Preload and cache clearing methods
- Cache statistics and monitoring

```typescript
import { cityService } from "./services";

// Get all cities
const cities = await cityService.getAllCities();

// Get specific city
const city = await cityService.getCityById(1);

// Preload
await cityService.preloadCities();

// Get cache info with type
const cacheInfo = await cityService.getCacheInfo();
```

### 6. PlaceService (`placeService.ts`)

- Singleton for working with places
- Uses abstract cache layer
- Pattern-based cache management
- City-specific cache operations

```typescript
import { placeService } from "./services";

// Get city places
const places = await placeService.getPlacesByCity(cityId);

// Preload places for city
await placeService.preloadPlacesForCity(cityId);

// Clear cache for specific city
await placeService.clearCityPlacesCache(cityId);
```

## Configuration

### Environment Variables

- `REDIS_URL` - If set, uses Redis cache; otherwise uses in-memory cache
- `STRAPI_HOST` - Strapi API host URL
- `STRAPI_TOKEN` - Bearer token for Strapi API authentication

### TTL Settings:

- Cities (list): 30 minutes
- City (single): 1 hour
- Places: 15 minutes

### Retry Settings:

- Number of attempts: 3
- Delay between attempts: 2 seconds

## Cache Key Structure

```
cities:all          # All cities list
city:123            # Specific city by ID
places:city:456     # Places for specific city
```

## Monitoring and Debugging

### Cache Information

```typescript
const info = await cacheManager.getCacheInfo();
// Returns: { type: 'redis' | 'memory', stats: { size, memory, keys } }
```

### Health Check

```typescript
const isHealthy = await cacheManager.healthCheck();
// Returns: boolean indicating cache functionality
```

### Pattern-based Operations

```typescript
// Clear all city-related cache
await cacheManager.clearByPattern("city:*");

// Clear all places cache
await cacheManager.clearByPattern("places:*");
```

## Development vs Production

### Development (No REDIS_URL)

- Uses in-memory cache
- Fast startup
- No external dependencies
- Data lost on restart

### Production (With REDIS_URL)

- Uses Redis cache
- Persistent data
- Scalable across instances
- Real memory monitoring

## API Authentication

All API requests automatically include the Bearer token from `STRAPI_TOKEN` environment variable:

```typescript
// Headers automatically added to all requests:
{
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${env.STRAPI_TOKEN}`
}
```

## Future Improvements

1. **Cache Warming**: Automatic preloading of popular data
2. **Circuit Breaker**: Protection against cascading failures
3. **Rate Limiting**: Limit request frequency to API
4. **Metrics**: Prometheus metrics for monitoring
5. **Cache Compression**: Reduce memory usage for large objects
6. **Multi-level Cache**: L1 (memory) + L2 (Redis) caching
