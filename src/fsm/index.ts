import { FSMConfig } from "./types";
import { start } from "./actions/start";
import { start_flow } from "./actions/start_flow";
import { wait_city } from "./actions/wait_city";
import { wait_days } from "./actions/wait_days";
import { payment_onboarding } from "./actions/payment_onboarding";
import { payment_success } from "./actions/payment_success";
import { payment_error } from "./actions/payment_error";
import { done } from "./actions/done";
import { dummy_payment } from "./actions/dummy_payment";
import { payment_cancel } from "./actions/payment_cancel";
import { generation_error } from "./actions/generation_error";

export const FSM: FSMConfig = {
  start,
  start_flow,
  wait_city,
  wait_days,
  payment_onboarding,
  payment_success,
  dummy_payment,
  payment_error,
  payment_cancel,
  done,
  generation_error,
};
