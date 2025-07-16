import { apiClient } from "./api";
import {
  Payment,
  PaymentData,
  CreatePaymentParams,
  UpdatePaymentParams,
  ApiResponse,
} from "./types";

export class PaymentService {
  private static instance: PaymentService;

  private constructor() {}

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  async createPayment(params: CreatePaymentParams): Promise<Payment> {
    const { guideId, userId } = params;

    console.log("createPayment params", params);

    const response = await apiClient.post<ApiResponse<PaymentData>>(
      "/payments",
      {
        data: {
          guide: guideId,
          user: userId,
        },
      }
    );

    console.log("createPayment response", response);

    const payment: Payment = {
      id: response.data.id,
      guideId: response.data.attributes.guideId,
      userId: response.data.attributes.userId,
      status: response.data.attributes.status,
    };

    return payment;
  }

  async updatePayment(
    paymentId: number,
    params: UpdatePaymentParams
  ): Promise<Payment> {
    const response = await apiClient.put<Payment>(`/payments/${paymentId}`, {
      data: params,
    });

    console.log("updatePayment response", response);

    return response;
  }
}

// Export singleton
export const paymentService = PaymentService.getInstance();
