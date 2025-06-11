import { Context, Markup } from "telegraf";
import { getCities } from "../cities";
import { generateGuide } from "../generateGuide";
import { fsmStore } from "./store";
import { Step } from "./types";
import { hideKeyboard } from "../utils/hideKeyboard";
import { findOrCreateUser } from "../findOrCreateUser";

type FSMConfig = {
  [state in Step]: {
    onEnter: (chatId: number, ctx: Context) => Promise<void>;
    onText?: (chatId: number, ctx: Context) => Promise<void>;
    onAction?: (chatId: number, ctx: Context, action: string) => Promise<void>;
  };
};

export const FSM: FSMConfig = {
  start: {
    onEnter: async (chatId, ctx) => {
      console.log("start onEnter");
      await fsmStore.set(chatId, { step: "start" });
      await FSM["start_flow"].onEnter(chatId, ctx);
    },
  },

  start_flow: {
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
  },

  wait_city: {
    onEnter: async (chatId, ctx) => {
      await fsmStore.update(chatId, { step: "wait_city" });
      const cities = await getCities();
      const buttons = cities.map(({ id, name }) =>
        Markup.button.callback(name, `city_${id}`)
      );
      await ctx.reply(
        "Пожалуйста, выберите город из кнопок ниже.",
        Markup.inlineKeyboard(buttons, { columns: 2 })
      );
    },
    onAction: async (chatId, ctx, action) => {
      await fsmStore.update(chatId, { step: "wait_city" });
      const match = action.match(/^city_(\d+)$/);
      if (!match) return;
      const selectedCityId = parseInt(match[1]);
      const cities = await getCities();
      const city = cities.find((c) => c.id === selectedCityId);
      if (!city) {
        await ctx.answerCbQuery("Город не найден");
        return;
      }

      await fsmStore.update(chatId, { cityId: selectedCityId });
      await ctx.answerCbQuery();
      await ctx.editMessageText(`🏙 Город выбран: ${city.name}`);
      await FSM["wait_days"].onEnter(chatId, ctx);
    },
  },

  wait_days: {
    onEnter: async (chatId, ctx) => {
      console.log("wait_days onEnter");
      await fsmStore.update(chatId, { step: "wait_days" });
      await ctx.reply("🗓 На сколько дней вы туда собираетесь?");
    },
    onText: async (chatId, ctx) => {
      console.log("wait_days onText");
      await fsmStore.update(chatId, { step: "wait_days" });
      const text = ctx.message && "text" in ctx.message ? ctx.message.text : "";
      const days = parseInt(text || "");
      if (isNaN(days) || days <= 0) {
        await ctx.reply("⛔ Введите число дней");
        return;
      }

      if (days > 10) {
        await ctx.reply("⛔ Максимум 10 дней");
        return;
      }

      await fsmStore.update(chatId, {
        days: days,
      });
      await FSM["payment_onboarding"].onEnter(chatId, ctx);
    },
  },

  payment_onboarding: {
    onEnter: async (chatId, ctx) => {
      await fsmStore.update(chatId, { step: "payment_onboarding" });
      await ctx.reply(
        `
✨ Отлично! Я создам для тебя гайд по Тбилиси на 3 дня:

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

      const user = await findOrCreateUser({
        telegramId: chatId,
        firstName: ctx.from?.first_name,
        username: ctx.from?.username,
      });

      console.log("user", user);

      if (user) {
        await FSM["payment_success"].onEnter(chatId, ctx);
      } else {
        await FSM["payment_error"].onEnter(chatId, ctx);
      }

      // await ctx.answerCbQuery();
      // await ctx.editMessageText("💳 Оплатить");
    },
  },

  payment_success: {
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
      const cities = await getCities();
      const city = cities.find((c) => c.id === state.cityId!);
      if (!city) {
        return FSM["wait_city"].onEnter(chatId, ctx);
      }

      generateGuide({
        chatId: chatId,
        cityId: state.cityId!,
        days: state.days!,
      });

      await FSM["done"].onEnter(chatId, ctx);
    },
  },

  payment_error: {
    onEnter: async (chatId, ctx) => {
      await fsmStore.update(chatId, { step: "payment_error" });
      await ctx.reply("💳 Платёж не прошёл. Попробуйте ещё раз.");

      await ctx.reply(
        "Хочешь попробовать снова?",
        Markup.inlineKeyboard([
          Markup.button.callback("🔄 Попробовать снова", "start_flow"),
          Markup.button.callback("Выбрать другой город", "wait_city"),
        ])
      );
    },

    onAction: async (chatId, ctx, action) => {
      await fsmStore.update(chatId, { step: "payment_error" });
      await hideKeyboard(ctx);
      if (action === "start_flow") {
        await FSM["payment_onboarding"].onEnter(chatId, ctx);
      } else if (action === "wait_city") {
        await FSM["wait_city"].onEnter(chatId, ctx);
      }
    },
  },

  done: {
    onEnter: async (chatId, ctx) => {
      await fsmStore.update(chatId, { step: "done" });
      await ctx.reply("🚀 Готово! Вот твой персональный гайд:");
      await ctx.reply("🔗 https://prstrvl.ru/guides/3hd9fcqk1j29fsd13");
      await ctx.reply(
        "Ты можешь сохранить его, распечатать или открыть в любой момент. Приятного путешествия! 🌍"
      );
      await fsmStore.update(chatId, { step: "start" });
    },
  },
};
