import { Markup } from "telegraf";
import { cityService } from "../../services";
import { fsmStore } from "../store";
import { FSM } from "..";
import { FSMAction } from "../types";

export const wait_city: FSMAction = {
  onEnter: async (chatId, ctx) => {
    await fsmStore.update(chatId, { step: "wait_city" });
    const cities = await cityService.getAllCities(true);
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
    const cities = await cityService.getAllCities();
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
};
