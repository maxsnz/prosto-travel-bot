import { Markup } from "telegraf";
import { fsmStore } from "../store";
import { FSM } from "..";
import { FSMAction } from "../types";
import { hideKeyboard } from "../../utils/hideKeyboard";

export const payment_cancel: FSMAction = {
  onEnter: async (chatId, ctx) => {
    await fsmStore.update(chatId, { step: "payment_cancel" });
    await ctx.reply("💳 Платёж был отменён.");

    await ctx.reply(
      "Хочешь попробовать снова?",
      Markup.inlineKeyboard([
        Markup.button.callback("🔄 Начать заново", "restart_flow"),
      ])
    );
  },

  onAction: async (chatId, ctx, action) => {
    await fsmStore.update(chatId, { step: "payment_cancel" });
    await hideKeyboard(ctx);
    if (action === "restart_flow") {
      await FSM["payment_onboarding"].onEnter(chatId, ctx);
    }
  },
};
