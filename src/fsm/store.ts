import { Redis } from "ioredis";
import { env } from "../config/env";
import { FsmState } from "./types";

export interface FsmStore {
  get(chatId: number): Promise<FsmState | undefined>;
  set(chatId: number, state: FsmState): Promise<void>;
  clear(chatId: number): Promise<void>;
  update(chatId: number, state: Partial<FsmState>): Promise<void>;
}

export class InMemoryFsmStore implements FsmStore {
  private store = new Map<number, FsmState>();

  async get(chatId: number) {
    return this.store.get(chatId);
  }

  async set(chatId: number, state: FsmState) {
    this.store.set(chatId, state);
  }

  async update(chatId: number, state: Partial<FsmState>) {
    const current = await this.get(chatId);
    if (!current) return;
    this.store.set(chatId, { ...current, ...state });
  }

  async clear(chatId: number) {
    this.store.delete(chatId);
  }
}

export class RedisFsmStore implements FsmStore {
  constructor(private redis: Redis) {}

  async get(chatId: number) {
    const raw = await this.redis.get(`fsm:${chatId}`);
    return raw ? JSON.parse(raw) : undefined;
  }

  async set(chatId: number, state: FsmState) {
    await this.redis.set(`fsm:${chatId}`, JSON.stringify(state));
  }

  async update(chatId: number, state: Partial<FsmState>) {
    const current = await this.get(chatId);
    if (!current) return;
    await this.redis.set(
      `fsm:${chatId}`,
      JSON.stringify({ ...current, ...state })
    );
  }

  async clear(chatId: number) {
    await this.redis.del(`fsm:${chatId}`);
  }
}

let store: FsmStore;

if (env.REDIS_URL) {
  const redis = new Redis(env.REDIS_URL);
  store = new RedisFsmStore(redis);
} else {
  store = new InMemoryFsmStore();
}

export const fsmStore = store;
