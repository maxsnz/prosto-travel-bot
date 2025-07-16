import { generateGuideQueue } from "../../queues/generationQueue";
import { fsmStore } from "../store";
import { FSM } from "..";
import { FSMAction } from "../types";
import { hideKeyboard } from "../../utils/hideKeyboard";
import { cityService } from "../../services";

export const payment_success: FSMAction = {
  onEnter: async (chatId, ctx) => {
    await fsmStore.update(chatId, { step: "payment_success" });
    await hideKeyboard(ctx);
    await ctx.reply("💳 Платёж прошёл успешно! Спасибо 🙏");
    await ctx.reply(
      "🔧 Генерирую для тебя гайд... это займёт около 10 секунд..."
    );

    const state = await fsmStore.get(chatId);
    if (!state) {
      throw new Error("State is not defined");
    }
    const city = await cityService.getCityById(state.cityId!);
    if (!city) {
      return FSM["wait_city"].onEnter(chatId, ctx);
    }

    if (!state.guideId) {
      throw new Error("guideId is not defined");
    }

    await generateGuideQueue.add("generate-guide", {
      guideId: state.guideId,
      userId: chatId,
    });
  },
};
