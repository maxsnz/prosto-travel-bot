import { Telegraf, Context } from "telegraf";
import { FSM } from "./fsm";
import { loadCities } from "./cities";
import { fsmStore } from "./fsm/store";
import env from "./config/env";

const bot = new Telegraf<Context>(env.TELEGRAM_TOKEN!);

bot.use((ctx, next) => {
  if (ctx.chat?.type === "private") {
    return next();
  }
});

bot.on("text", async (ctx) => {
  if (!ctx.chat?.id) return;

  const state = await fsmStore.get(ctx.chat.id);
  const step = state?.step || "start";
  const handler = FSM[step];
  if (handler.onText) await handler.onText(ctx.chat.id, ctx);
  else if (handler.onEnter) await handler.onEnter(ctx.chat.id, ctx);
});

bot.on("callback_query", async (ctx) => {
  if (!ctx.chat?.id) return;

  const state = await fsmStore.get(ctx.chat.id);
  const step = state?.step || "start";
  const handler = FSM[step];
  if (handler.onAction && ctx.callbackQuery && "data" in ctx.callbackQuery) {
    const action = ctx.callbackQuery.data;
    await handler.onAction(ctx.chat.id, ctx, action);
  }
});

loadCities();
bot.launch();
console.log("🚀 Bot started");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
