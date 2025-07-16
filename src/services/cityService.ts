import { apiClient } from "./api";
import { cacheManager } from "./cacheManager";
import { ApiListResponse, ApiResponse, CityData, City } from "./types";

export class CityService {
  private static instance: CityService;

  private constructor() {}

  static getInstance(): CityService {
    if (!CityService.instance) {
      CityService.instance = new CityService();
    }
    return CityService.instance;
  }

  async getAllCities(): Promise<City[]> {
    const cacheKey = "cityGuides:all";
    const cached = await cacheManager.get<City[]>(cacheKey);

    if (cached) {
      return cached;
    }

    const response = await apiClient.request<ApiListResponse<CityData>>(
      "/city-guides"
    );

    const cities = response.data.map((item) => ({
      id: item.id,
      name: item.attributes.name,
    }));

    // Cache for 30 minutes
    await cacheManager.set(cacheKey, cities, 30 * 60 * 1000);

    return cities;
  }

  async getCityById(cityId: number): Promise<City> {
    const cacheKey = `cityGuides:${cityId}`;
    const cached = await cacheManager.get<City>(cacheKey);

    if (cached) {
      return cached;
    }

    const response = await apiClient.request<ApiResponse<CityData>>(
      `/city-guides/${cityId}`
    );

    const city: City = {
      id: response.data.id,
      name: response.data.attributes.name,
      description: response.data.attributes.description,
    };

    // Cache for 1 hour
    await cacheManager.set(cacheKey, city, 60 * 60 * 1000);

    return city;
  }

  // Method for preloading all cities
  async preloadCities(): Promise<void> {
    try {
      await this.getAllCities();
    } catch (error) {
      console.error("Failed to preload cities:", error);
    }
  }
}

// Export singleton
export const cityService = CityService.getInstance();
