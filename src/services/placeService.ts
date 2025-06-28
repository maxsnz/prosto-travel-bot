import { apiClient } from "./api";
import { cacheManager } from "./cacheManager";
import { ApiListResponse, PlaceData, Place } from "./types";

export class PlaceService {
  private static instance: PlaceService;

  private constructor() {}

  static getInstance(): PlaceService {
    if (!PlaceService.instance) {
      PlaceService.instance = new PlaceService();
    }
    return PlaceService.instance;
  }

  async getPlacesByCity(cityId: number): Promise<Place[]> {
    const cacheKey = `places:city:${cityId}`;
    const cached = await cacheManager.get<Place[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const endpoint = `/places?filters[city][id][$eq]=${cityId}&populate=tags&pagination[pageSize]=1000`;
    const response = await apiClient.request<ApiListResponse<PlaceData>>(
      endpoint
    );

    const places: Place[] = response.data.map((item) => ({
      id: item.id,
      name: item.attributes.name,
      address: item.attributes.address,
      description: item.attributes.description,
      mapLink: item.attributes.mapLink,
      coords: item.attributes.coords,
      imageUrl: item.attributes.imageUrl,
      tags: item.attributes.tags.map((tag) => tag.name),
    }));

    // Cache for 15 minutes
    await cacheManager.set(cacheKey, places, 15 * 60 * 1000);

    return places;
  }

  // Method for preloading places for specific city
  async preloadPlacesForCity(cityId: number): Promise<void> {
    try {
      await this.getPlacesByCity(cityId);
      console.log(`✅ Places for city ${cityId} preloaded successfully`);
    } catch (error) {
      console.error(`❌ Failed to preload places for city ${cityId}:`, error);
    }
  }

  // Method for clearing places cache for specific city
  async clearCityPlacesCache(cityId: number): Promise<void> {
    await cacheManager.delete(`places:city:${cityId}`);
  }

  // Method for clearing all places cache
  async clearAllPlacesCache(): Promise<void> {
    await cacheManager.clearByPattern("places:*");
  }

  // Get cache statistics
  async getCacheStats(): Promise<any> {
    return await cacheManager.getStats();
  }

  // Get cache info with type
  async getCacheInfo(): Promise<any> {
    return await cacheManager.getCacheInfo();
  }
}

// Export singleton
export const placeService = PlaceService.getInstance();
