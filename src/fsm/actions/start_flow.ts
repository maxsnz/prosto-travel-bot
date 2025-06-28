import { Markup } from "telegraf";
import { fsmStore } from "../store";
import { FSM } from "..";
import { FSMAction } from "../types";
import { hideKeyboard } from "../../utils/hideKeyboard";

export const start_flow: FSMAction = {
  onEnter: async (chatId, ctx) => {
    console.log("start_flow onEnter");
    await fsmStore.set(chatId, { step: "start_flow" });
    await ctx.reply(
      "👋 Привет! Я — AI-гид по путешествиям.\n\nХочешь получить персональный маршрут по выбранному городу? 🚀",
      Markup.inlineKeyboard(
        [Markup.button.callback("🚀 Начать", "start_flow")],
        {}
      )
    );
  },

  onAction: async (chatId, ctx) => {
    console.log("start_flow onAction");

    await hideKeyboard(ctx);
    await fsmStore.set(chatId, { step: "start_flow" });
    await FSM["wait_city"].onEnter(chatId, ctx);
  },
};
