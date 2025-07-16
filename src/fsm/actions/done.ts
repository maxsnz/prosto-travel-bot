import { fsmStore } from "../store";
import { FSMAction } from "../types";
import env from "../../config/env";
import { hideKeyboard } from "../../utils/hideKeyboard";

export const done: FSMAction = {
  onEnter: async (chatId, ctx) => {
    await fsmStore.update(chatId, { step: "done" });
  },
  onAction: async (chatId, ctx, action) => {
    if (action === "get_guide") {
      // Answer callback query to remove loading indicator
      await ctx.answerCbQuery();
      await hideKeyboard(ctx);

      const state = await fsmStore.get(chatId);
      if (state?.guideHash) {
        // TODO: link change id to hash
        await ctx.reply(`🔗 ${env.STRAPI_HOST}/guide/${state.guideHash}`);
        await ctx.reply(
          "Ты можешь сохранить его, распечатать или открыть в любой момент. Приятного путешествия! 🌍"
        );
      } else {
        await ctx.reply(
          "❌ Извините, гид не найден. Попробуйте создать новый гид."
        );
      }
      await fsmStore.update(chatId, { step: "start" });
    }
  },
};
