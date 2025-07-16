import { fsmStore } from "../store";
import { FSMAction } from "../types";
import env from "../../config/env";
import { hideKeyboard } from "../../utils/hideKeyboard";
import { FSM } from "..";

export const generation_error: FSMAction = {
  onEnter: async (chatId, ctx) => {
    await fsmStore.update(chatId, { step: "generation_error" });
  },
  onAction: async (chatId, ctx, action) => {
    if (action === "restart") {
      // Answer callback query to remove loading indicator
      await ctx.answerCbQuery();
      await hideKeyboard(ctx);

      await FSM["start"].onEnter(chatId, ctx);
    }
  },
};
