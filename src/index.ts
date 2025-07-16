import { Telegraf, Context } from "telegraf";
import { FSM } from "./fsm";
import { cityService, cacheManager } from "./services";
import { fsmStore } from "./fsm/store";
import env from "./config/env";

async function startBot() {
  try {
    const bot = new Telegraf<Context>(env.TELEGRAM_TOKEN!);

    bot.use((ctx, next) => {
      if (ctx.chat?.type === "private") {
        return next();
      }
    });

    bot.on("text", async (ctx) => {
      try {
        if (!ctx.chat?.id) return;

        if (ctx.message.text === "/start") {
          await FSM.start.onEnter(ctx.chat.id, ctx);
          return;
        }

        const state = await fsmStore.get(ctx.chat.id);
        const step = state?.step || "start";
        const handler = FSM[step];
        if (handler.onText) await handler.onText(ctx.chat.id, ctx);
        else if (handler.onEnter) await handler.onEnter(ctx.chat.id, ctx);
      } catch (error) {
        console.error("Error handling text message:", error);
        try {
          await ctx.reply("Sorry, something went wrong. Please try again.");
        } catch (replyError) {
          console.error("Error sending error message:", replyError);
        }
      }
    });

    bot.on("callback_query", async (ctx) => {
      try {
        if (!ctx.chat?.id) return;

        const state = await fsmStore.get(ctx.chat.id);
        const step = state?.step || "start";
        const handler = FSM[step];
        if (
          handler.onAction &&
          ctx.callbackQuery &&
          "data" in ctx.callbackQuery
        ) {
          const action = ctx.callbackQuery.data;
          await handler.onAction(ctx.chat.id, ctx, action);
        }
      } catch (error) {
        console.error("Error handling callback query:", error);
        try {
          await ctx.answerCbQuery("Something went wrong. Please try again.");
        } catch (replyError) {
          console.error("Error answering callback query:", replyError);
        }
      }
    });

    // Preload cities on startup
    cityService.preloadCities();

    bot.launch();
    console.log("Bot started");

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      console.log(`\n Received ${signal}, shutting down gracefully...`);

      try {
        await bot.stop(signal);
        await cacheManager.close();
        console.log("Graceful shutdown completed");
        process.exit(0);
      } catch (error) {
        console.error("Error during shutdown:", error);
        process.exit(1);
      }
    };

    process.once("SIGINT", () => shutdown("SIGINT"));
    process.once("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start bot:", error);
    process.exit(1);
  }
}

// Start the bot
startBot().catch((error) => {
  console.error("Critical error during bot startup:", error);
  process.exit(1);
});
