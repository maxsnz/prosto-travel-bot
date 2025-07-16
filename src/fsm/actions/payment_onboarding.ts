import { Markup } from "telegraf";
import { userService } from "../../services";
import { fsmStore } from "../store";
import { FSM } from "..";
import { FSMAction } from "../types";
import { hideKeyboard } from "../../utils/hideKeyboard";
import { plural } from "../../utils/plural";
import { cityService, guideService, paymentService } from "../../services";

export const payment_onboarding: FSMAction = {
  onEnter: async (chatId, ctx) => {
    await fsmStore.update(chatId, { step: "payment_onboarding" });
    const state = await fsmStore.get(chatId);
    if (!state) {
      throw new Error("State is not defined");
    }
    if (!state.cityId) {
      console.error("CityId is not defined");
      return FSM["wait_city"].onEnter(chatId, ctx);
    }
    const city = await cityService.getCityById(state.cityId);
    if (!city) {
      // go to wait_city
      console.error("City is not defined");
      return FSM["wait_city"].onEnter(chatId, ctx);
    }
    if (!state.days) {
      // go to wait_days
      console.error("Days is not defined");
      return FSM["wait_days"].onEnter(chatId, ctx);
    }

    await ctx.reply(
      `
✨ Отлично! Я создам для тебя гайд по ${city.name} на ${state.days} ${plural(
        state.days,
        "день",
        "дня",
        "дней"
      )}:

📌 Персональный маршрут  
🏛 Интересные места  
🍽 Локальная еда  
🧠 Рекомендации AI

Стоимость: **399 ₽**

Гайд будет доступен сразу после оплаты.        
`,
      Markup.inlineKeyboard([
        Markup.button.callback("💳 Оплатить", "start_payment"),
      ])
    );
  },
  onAction: async (chatId, ctx, action) => {
    await fsmStore.update(chatId, { step: "payment_onboarding" });
    await hideKeyboard(ctx);
    console.log("payment_onboarding onAction", action);

    try {
      const user = await userService.findOrCreateUser({
        telegramId: chatId,
        firstName: ctx.from?.first_name,
        username: ctx.from?.username,
      });

      const state = await fsmStore.get(chatId);
      if (!state) {
        throw new Error("State is not defined");
      }
      if (!state.cityId) {
        await FSM["wait_city"].onEnter(chatId, ctx);
        return;
      }
      if (!state.days) {
        await FSM["wait_days"].onEnter(chatId, ctx);
        return;
      }

      const guide = await guideService.createGuide({
        userId: user.id,
        cityId: state.cityId,
        days: state.days,
      });

      await fsmStore.update(chatId, { guideId: guide.id });

      const payment = await paymentService.createPayment({
        guideId: guide.id,
        userId: user.id,
      });

      console.log("payment", payment);

      await fsmStore.update(chatId, { paymentId: payment.id });

      await FSM["dummy_payment"].onEnter(chatId, ctx);
    } catch (error) {
      console.error("Failed to find or create user:", error);
      await FSM["payment_error"].onEnter(chatId, ctx);
    }

    // await ctx.answerCbQuery();
    // await ctx.editMessageText("💳 Оплатить");
  },
};
