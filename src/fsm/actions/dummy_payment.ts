import { Markup } from "telegraf";
import { fsmStore } from "../store";
import { FSM } from "..";
import { FSMAction } from "../types";
import { hideKeyboard } from "../../utils/hideKeyboard";
import { guideService, paymentService } from "../../services";

export const dummy_payment: FSMAction = {
  onEnter: async (chatId, ctx) => {
    await fsmStore.update(chatId, { step: "dummy_payment" });

    await ctx.reply(
      "This is dummy payment. Result?",
      Markup.inlineKeyboard([
        Markup.button.callback("Error", "payment_error"),
        Markup.button.callback("Success", "payment_success"),
        Markup.button.callback("Cancel", "payment_cancel"),
      ])
    );
  },

  onAction: async (chatId, ctx, action) => {
    await fsmStore.update(chatId, { step: "dummy_payment" });
    await hideKeyboard(ctx);

    const state = await fsmStore.get(chatId);
    if (!state) {
      throw new Error("State is not defined");
    }
    if (!state.paymentId) {
      console.error("PaymentId is not defined");
      await FSM["payment_error"].onEnter(chatId, ctx);
      return;
    }
    if (!state.guideId) {
      console.error("GuideId is not defined");
      await FSM["payment_error"].onEnter(chatId, ctx);
      return;
    }

    if (action === "payment_error") {
      await FSM["payment_error"].onEnter(chatId, ctx);
      await paymentService.updatePayment(state.paymentId, {
        status: "failed",
      });
    } else if (action === "payment_success") {
      await paymentService.updatePayment(state.paymentId, {
        status: "paid",
      });
      await guideService.updateGuide(state.guideId, {
        status: "paid",
      });
      await FSM["payment_success"].onEnter(chatId, ctx);
    } else if (action === "payment_cancel") {
      await paymentService.updatePayment(state.paymentId, {
        status: "cancelled",
      });
      await FSM["payment_cancel"].onEnter(chatId, ctx);
    }
  },
};
