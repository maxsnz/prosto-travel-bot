import { Markup } from "telegraf";
import { userService } from "../../services";
import { fsmStore } from "../store";
import { FSM } from "..";
import { FSMAction } from "../types";
import { hideKeyboard } from "../../utils/hideKeyboard";
import { plural, pluralDay } from "../../utils/plural";
import { cityService, guideService, paymentService } from "../../services";
import { paymentTimeoutService } from "../../services/paymentTimeoutService";
import price from "../../config/price";
import env from "../../config/env";

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

Стоимость: ${price.guide / 100} ₽

Гайд будет доступен сразу после оплаты.        
`,
      Markup.inlineKeyboard([
        Markup.button.callback(
          `💳 Оплатить ${price.guide / 100} ₽`,
          "start_payment"
        ),
      ])
    );
  },
  onAction: async (chatId, ctx, action) => {
    await fsmStore.update(chatId, { step: "payment_onboarding" });
    await hideKeyboard(ctx);
    console.log("payment_onboarding onAction", action);

    if (action === "cancel_payment") {
      const state = await fsmStore.get(chatId);
      if (state?.paymentId) {
        // Clear the timeout
        paymentTimeoutService.clearTimeout(chatId, state.paymentId);

        // Update payment status to cancelled
        await paymentService.updatePayment(state.paymentId, {
          status: "cancelled",
        });
      }
      await FSM["payment_cancel"].onEnter(chatId, ctx);
      return;
    }

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

      console.log("[BOT] payment", payment);

      await fsmStore.update(chatId, { paymentId: payment.id });

      const payload = `guide_${guide.id}`;
      const city = await cityService.getCityById(state.cityId);
      if (!city) {
        throw new Error("City is not defined");
      }

      await ctx.replyWithInvoice({
        // chat_id: chatId,
        title: `Гид по ${city.name}`,
        description: `Гид по ${city.name} на ${state.days} ${pluralDay(
          state.days
        )}`,
        payload,
        provider_token: env.YOOKASSA_PROVIDER_TOKEN,
        currency: price.currency,
        prices: [{ label: "К оплате", amount: price.guide }],
        // start_parameter: "get_guide",
        need_email: false,
        need_name: false,
        need_phone_number: false,
      });

      // // Send cancel button after invoice
      // await ctx.reply(
      //   "💳 Платёж отправлен. Если что-то пошло не так, можете отменить:",
      //   Markup.inlineKeyboard([
      //     Markup.button.callback("❌ Отменить платёж", "cancel_payment"),
      //   ])
      // );

      // Set up payment timeout using the service
      paymentTimeoutService.setupTimeout(chatId, payment.id);
    } catch (error) {
      console.error("Failed to find or create user:", error);
      await FSM["payment_error"].onEnter(chatId, ctx);
    }
  },
  onPayment: async (chatId, ctx, payment) => {
    const state = await fsmStore.get(chatId);
    if (!state) {
      console.error("State is not defined");
      return;
    }

    if (!state.paymentId) {
      console.error("PaymentId is not defined");
      return;
    }

    if (!state.guideId) {
      console.error("GuideId is not defined");
      return;
    }

    const payload = payment.invoice_payload; // "guide_123"
    const guideId = payload.split("_")[1];

    if (
      payment.total_amount !== price.guide ||
      payment.currency !== price.currency
    ) {
      console.error("❌ Payment amount/currency validation failed");
      await paymentService.updatePayment(state.paymentId, {
        status: "failed",
      });
      await FSM["payment_error"].onEnter(chatId, ctx);
      return;
    }

    // Clear the timeout since payment was successful
    paymentTimeoutService.clearTimeout(chatId, state.paymentId);

    // Update payment status
    await paymentService.updatePayment(state.paymentId, {
      status: "paid",
      amount: payment.total_amount,
      telegram_payment_charge_id: payment.telegram_payment_charge_id,
      provider_payment_charge_id: payment.provider_payment_charge_id,
      invoice_payload: payload,
    });

    // Update guide status to paid
    await guideService.updateGuide(state.guideId, {
      status: "paid",
    });

    await FSM["payment_success"].onEnter(chatId, ctx);
  },
  onPreCheckout: async (userId, ctx, preCheckoutQuery) => {
    console.log("Pre-checkout query received:", preCheckoutQuery);

    const state = await fsmStore.get(userId);
    if (!state) {
      console.error("State not found for pre-checkout query");
      await ctx.answerPreCheckoutQuery(
        false,
        "Session expired. Please start over."
      );
      return;
    }

    // Validate payment amount and currency
    if (
      preCheckoutQuery.total_amount !== price.guide ||
      preCheckoutQuery.currency !== price.currency
    ) {
      console.error("Invalid payment amount or currency in pre-checkout");
      await ctx.answerPreCheckoutQuery(
        false,
        "Invalid payment amount or currency."
      );
      return;
    }

    // Validate that we have required state data
    if (!state.paymentId || !state.guideId) {
      console.error("Missing payment or guide data in pre-checkout");
      await ctx.answerPreCheckoutQuery(
        false,
        "Payment data is incomplete. Please try again."
      );
      return;
    }

    // Validate invoice payload format
    const payload = preCheckoutQuery.invoice_payload;
    if (!payload || !payload.startsWith("guide_")) {
      console.error("Invalid invoice payload in pre-checkout");
      await ctx.answerPreCheckoutQuery(false, "Invalid payment data.");
      return;
    }

    // Extract guide ID from payload and validate
    const guideId = payload.split("_")[1];
    if (!guideId || parseInt(guideId) !== state.guideId) {
      console.error("Guide ID mismatch in pre-checkout");
      await ctx.answerPreCheckoutQuery(
        false,
        "Payment data mismatch. Please try again."
      );
      return;
    }

    // All validations passed - approve the pre-checkout
    console.log("Pre-checkout validation successful for user:", userId);
    await ctx.answerPreCheckoutQuery(true);
  },
};
