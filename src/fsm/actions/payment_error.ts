import { Markup } from "telegraf";
import { fsmStore } from "../store";
import { FSM } from "..";
import { FSMAction } from "../types";
import { hideKeyboard } from "../../utils/hideKeyboard";

export const payment_error: FSMAction = {
  onEnter: async (chatId, ctx) => {
    await fsmStore.update(chatId, { step: "payment_error" });
    await ctx.reply("💳 Платёж не прошёл. Попробуйте ещё раз.");

    await ctx.reply(
      "Хочешь попробовать снова?",
      Markup.inlineKeyboard([
        Markup.button.callback("🔄 Попробовать снова", "start_flow"),
        Markup.button.callback("Выбрать другой город", "wait_city"),
      ])
    );
  },

  onAction: async (chatId, ctx, action) => {
    await fsmStore.update(chatId, { step: "payment_error" });
    await hideKeyboard(ctx);
    if (action === "start_flow") {
      await FSM["payment_onboarding"].onEnter(chatId, ctx);
    } else if (action === "wait_city") {
      await FSM["wait_city"].onEnter(chatId, ctx);
    }
  },
};
