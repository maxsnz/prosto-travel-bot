import { paymentService } from "./paymentService";
import { fsmStore } from "../fsm/store";
import { FSM } from "../fsm";

interface PaymentTimeout {
  chatId: number;
  paymentId: number;
  timeoutId: NodeJS.Timeout;
  createdAt: Date;
}

export class PaymentTimeoutService {
  private static instance: PaymentTimeoutService;
  private timeouts: Map<string, PaymentTimeout> = new Map();

  private constructor() {}

  static getInstance(): PaymentTimeoutService {
    if (!PaymentTimeoutService.instance) {
      PaymentTimeoutService.instance = new PaymentTimeoutService();
    }
    return PaymentTimeoutService.instance;
  }

  /**
   * Set up a payment timeout
   * @param chatId - Telegram chat ID
   * @param paymentId - Payment ID
   * @param timeoutMs - Timeout in milliseconds
   */
  setupTimeout(
    chatId: number,
    paymentId: number,
    timeoutMs: number = 5 * 60 * 1000
  ): void {
    const key = `${chatId}_${paymentId}`;

    // Clear existing timeout if any
    this.clearTimeout(chatId, paymentId);

    const timeoutId = setTimeout(async () => {
      await this.handleTimeout(chatId, paymentId);
    }, timeoutMs);

    this.timeouts.set(key, {
      chatId,
      paymentId,
      timeoutId,
      createdAt: new Date(),
    });

    console.log(`Payment timeout set for chat ${chatId}, payment ${paymentId}`);
  }

  /**
   * Clear a payment timeout
   * @param chatId - Telegram chat ID
   * @param paymentId - Payment ID
   */
  clearTimeout(chatId: number, paymentId: number): void {
    const key = `${chatId}_${paymentId}`;
    const timeout = this.timeouts.get(key);

    if (timeout) {
      clearTimeout(timeout.timeoutId);
      this.timeouts.delete(key);
      console.log(
        `Payment timeout cleared for chat ${chatId}, payment ${paymentId}`
      );
    }
  }

  /**
   * Handle payment timeout
   * @param chatId - Telegram chat ID
   * @param paymentId - Payment ID
   */
  private async handleTimeout(
    chatId: number,
    paymentId: number
  ): Promise<void> {
    try {
      const currentState = await fsmStore.get(chatId);

      // Only handle timeout if user is still in payment_onboarding state
      // and the payment ID matches
      if (
        currentState?.step === "payment_onboarding" &&
        currentState.paymentId === paymentId
      ) {
        console.log(
          `Payment timeout triggered for chat ${chatId}, payment ${paymentId}`
        );

        // Update payment status to failed
        await paymentService.updatePayment(paymentId, {
          status: "failed",
        });

        // Clear the timeout from our map
        this.clearTimeout(chatId, paymentId);

        // Transition to payment error state
        // Note: We need to create a mock context here since we don't have the original context
        const mockContext = {
          chat: { id: chatId },
          reply: async (text: string) => console.log(`Mock reply: ${text}`),
        } as any;

        await FSM["payment_error"].onEnter(chatId, mockContext);
      }
    } catch (error) {
      console.error(
        `Error handling payment timeout for chat ${chatId}, payment ${paymentId}:`,
        error
      );
    }
  }

  /**
   * Get all active timeouts (for debugging/monitoring)
   */
  getActiveTimeouts(): PaymentTimeout[] {
    return Array.from(this.timeouts.values());
  }

  /**
   * Clear all timeouts (useful for shutdown)
   */
  clearAllTimeouts(): void {
    for (const timeout of this.timeouts.values()) {
      clearTimeout(timeout.timeoutId);
    }
    this.timeouts.clear();
    console.log("All payment timeouts cleared");
  }
}

// Export singleton
export const paymentTimeoutService = PaymentTimeoutService.getInstance();
