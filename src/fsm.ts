import { Markup } from "telegraf";
import dotenv from "dotenv";
import { MyContext, Step } from "./types/session";
import { getCities } from "./cities";
dotenv.config();

export const FSM_HANDLER: Record<Step, (ctx: MyContext) => Promise<void>> = {
  start: async (ctx) => {
    const cities = await getCities();
    const buttons = cities.map(({ id, name }) =>
      Markup.button.callback(name, `city_${id}`)
    );
    const keyboard = Markup.inlineKeyboard(buttons, { columns: 2 });
    await ctx.reply("👋 Привет! Куда хотите поехать?", keyboard);
    ctx.session.step = "wait_city";
  },

  wait_city: async (ctx) => {
    const cities = await getCities();
    const buttons = cities.map(({ id, name }) =>
      Markup.button.callback(name, `city_${id}`)
    );
    const keyboard = Markup.inlineKeyboard(buttons, { columns: 2 });
    await ctx.reply("⛔ Пожалуйста, выберите город из кнопок ниже.", keyboard);
  },

  wait_days: async (ctx) => {
    const text = "text" in ctx.message! ? ctx.message.text : "";
    if (!text) return;

    const days = parseInt(text);
    if (isNaN(days) || days <= 0) {
      await ctx.reply("⛔ Пожалуйста, введите положительное число дней.");
      return;
    }

    ctx.session.days = days;

    if (!ctx.session.cityId) {
      FSM_HANDLER.wait_city(ctx);
      return;
    }
    const cities = await getCities();
    const city = cities.find((city) => city.id === ctx.session.cityId);
    if (!city) {
      FSM_HANDLER.wait_city(ctx);
      return;
    }

    await ctx.reply(
      `✅ Ваш персональный гид в городе ${city.name} на ${ctx.session.days} дней принят в работу!`
    );

    ctx.session.step = "done";

    const workerHost = process.env.WORKER_HOST;
    if (!workerHost) {
      console.error("WORKER_HOST not defined");
      await ctx.reply("⚠️ Внутренняя ошибка: не настроен обработчик.");
    } else {
      try {
        await fetch(`${workerHost}/generate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chatId: ctx.chat?.id,
            cityId: ctx.session.cityId,
            days: ctx.session.days,
          }),
        });
      } catch (err) {
        console.error("Error sending request to worker:", err);
        await ctx.reply("⚠️ Не удалось запустить генерацию гайда.");
      }
    }
  },

  done: async (ctx) => {
    await ctx.reply(
      "🎉 Спасибо! Хотите начать заново? Напишите любое сообщение."
    );
    ctx.session.step = "start";
  },
};
