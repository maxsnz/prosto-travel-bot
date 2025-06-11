export type Step =
  | "start"
  | "start_flow"
  | "wait_city"
  | "wait_days"
  | "payment_onboarding"
  | "payment_success"
  | "payment_error"
  | "done";

export interface FsmState {
  step: Step;
  cityId?: number;
  days?: number;
  // [key: string]: any;
}
