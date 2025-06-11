import { Context } from "telegraf";

export const hideKeyboard = async (ctx: Context) => {
  if ("editMessageReplyMarkup" in ctx) {
    try {
      await ctx.editMessageReplyMarkup(undefined);
    } catch (err) {}
  }
};
