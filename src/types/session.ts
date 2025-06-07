// types/session.ts
import { Context } from "telegraf";

export type Step = "start" | "wait_city" | "wait_days" | "done";

export interface SessionData {
  step: Step;
  cityId?: number;
  days?: number;
}

export type MyContext = Context & { session: SessionData };
