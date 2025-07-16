import { fsmStore } from "../store";
import { FSMAction } from "../types";
import env from "../../config/env";
import { hideKeyboard } from "../../utils/hideKeyboard";
import { Markup } from "telegraf";
import { FSM } from "..";

export const done: FSMAction = {
  onEnter: async (chatId, ctx) => {
    await fsmStore.update(chatId, { step: "done" });
  },
  onAction: async (chatId, ctx, action) => {
    if (action === "get_guide") {
      await ctx.answerCbQuery();
      await hideKeyboard(ctx);

      const state = await fsmStore.get(chatId);
      if (state?.guideHash) {
        await ctx.reply(`🔗 ${env.STRAPI_HOST}/guide/${state.guideHash}`);
        await ctx.reply(
          "Ты можешь сохранить его, распечатать или открыть в любой момент. Приятного путешествия! 🌍",
          Markup.inlineKeyboard([
            Markup.button.callback("🔄 Начать сначала", "start_over"),
          ])
        );
      } else {
        await ctx.reply(
          "❌ Извините, гид не найден. Попробуйте создать новый гид.",
          Markup.inlineKeyboard([
            Markup.button.callback("🔄 Начать сначала", "start_over"),
          ])
        );
      }
    } else if (action === "start_over") {
      await ctx.answerCbQuery();
      await hideKeyboard(ctx);

      await FSM["start"].onEnter(chatId, ctx);
    }
  },
};
