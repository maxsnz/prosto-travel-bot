import { Context } from "telegraf";

export type Step =
  | "start"
  | "start_flow"
  | "wait_city"
  | "wait_days"
  | "payment_onboarding"
  | "dummy_payment"
  | "payment_success"
  | "payment_error"
  | "payment_cancel"
  | "generation_error"
  | "done";

export interface FsmState {
  step: Step;
  cityId?: number;
  days?: number;
  guideId?: number;
  paymentId?: number;
  guideHash?: string;
  // [key: string]: any;
}

export interface FSMAction {
  onEnter: (chatId: number, ctx: Context) => Promise<void>;
  onText?: (chatId: number, ctx: Context) => Promise<void>;
  onAction?: (chatId: number, ctx: Context, action: string) => Promise<void>;
  onPayment?: (chatId: number, ctx: Context, payment: any) => Promise<void>;
  onPreCheckout?: (
    userId: number,
    ctx: Context,
    preCheckoutQuery: any
  ) => Promise<void>;
}

export type FSMConfig = {
  [state in Step]: FSMAction;
};
