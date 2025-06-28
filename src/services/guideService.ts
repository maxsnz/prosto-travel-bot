import { apiClient } from "./api";
import {
  Guide,
  CreateGuideParams,
  ApiResponse,
  GuideData,
  UpdateGuideParams,
} from "./types";

export class GuideService {
  private static instance: GuideService;

  private constructor() {}

  static getInstance(): GuideService {
    if (!GuideService.instance) {
      GuideService.instance = new GuideService();
    }
    return GuideService.instance;
  }

  async createGuide(params: CreateGuideParams): Promise<Guide> {
    const { userId, cityId } = params;

    const response = await apiClient.post<ApiResponse<GuideData>>("/guides", {
      data: {
        user: userId,
        city_guide: cityId,
      },
    });

    const guide: Guide = {
      id: response.data.id,
      userId: response.data.attributes.userId,
      cityId: response.data.attributes.cityId,
      status: response.data.attributes.status,
    };

    return guide;
  }

  async updateGuide(
    guideId: number,
    params: UpdateGuideParams
  ): Promise<Guide> {
    const response = await apiClient.put<ApiResponse<GuideData>>(
      `/guides/${guideId}`,
      {
        data: params,
      }
    );

    const guide: Guide = {
      id: response.data.id,
      userId: response.data.attributes.userId,
      cityId: response.data.attributes.cityId,
      status: response.data.attributes.status,
    };

    return guide;
  }
}

// Export singleton
export const guideService = GuideService.getInstance();
