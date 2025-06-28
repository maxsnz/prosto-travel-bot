import { fsmStore } from "../store";
import { FSMAction } from "../types";
import env from "../../config/env";

export const done: FSMAction = {
  onEnter: async (chatId, ctx) => {
    await fsmStore.update(chatId, { step: "done" });
    await ctx.reply("🚀 Готово! Вот твой персональный гайд:");
    await ctx.reply(`🔗 ${env.STRAPI_HOST}/guides/3hd9fcqk1j29fsd13`);
    await ctx.reply(
      "Ты можешь сохранить его, распечатать или открыть в любой момент. Приятного путешествия! 🌍"
    );
    await fsmStore.update(chatId, { step: "start" });
  },
};
