import { fsmStore } from "../store";
import { FSM } from "..";
import { FSMAction } from "../types";

export const wait_days: FSMAction = {
  onEnter: async (chatId, ctx) => {
    console.log("wait_days onEnter");
    await fsmStore.update(chatId, { step: "wait_days" });
    await ctx.reply("🗓 На сколько дней вы туда собираетесь?");
  },
  onText: async (chatId, ctx) => {
    console.log("wait_days onText");
    await fsmStore.update(chatId, { step: "wait_days" });
    const text = ctx.message && "text" in ctx.message ? ctx.message.text : "";
    const days = parseInt(text || "");
    if (isNaN(days) || days <= 0) {
      await ctx.reply("⛔ Введите число дней");
      return;
    }

    if (days > 10) {
      await ctx.reply("⛔ Максимум 10 дней");
      return;
    }

    await fsmStore.update(chatId, {
      days: days,
    });
    await FSM["payment_onboarding"].onEnter(chatId, ctx);
  },
};
