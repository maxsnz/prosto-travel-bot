import { generateGuide } from "../../generateGuide";
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
      console.error("State is not defined");
      return;
    }
    const city = await cityService.getCityById(state.cityId!);
    if (!city) {
      return FSM["wait_city"].onEnter(chatId, ctx);
    }

    generateGuide({
      chatId: chatId,
      cityId: state.cityId!,
      days: state.days!,
    });

    await generateGuideQueue.add("generate-guide", {
      guideId: "abc123",
      userId: "tgUser42",
      // city: "Vladimir",
      // templateVersion: "v1",
    });

    await FSM["done"].onEnter(chatId, ctx);
  },
};
