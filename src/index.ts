import dotenv from "dotenv";
import { Telegraf, session, Context, Scenes, Markup } from "telegraf";
import { FSM_HANDLER } from "./fsm";
import { MyContext, SessionData } from "./types/session";
import { getCities, loadCities } from "./cities";
dotenv.config();

const bot = new Telegraf<MyContext>(process.env.TELEGRAM_TOKEN!);

bot.use(
  session({
    defaultSession: (): SessionData => ({
      step: "start",
    }),
  })
);

bot.on("text", async (ctx: MyContext) => {
  const step = ctx.session.step || "start";
  await FSM_HANDLER[step](ctx);
});

bot.action(/city_(.+)/, async (ctx) => {
  const selectedCityId = parseInt(ctx.match[1]);
  const cities = await getCities();
  const selectedCity = cities.find((city) => city.id === selectedCityId);
  if (!selectedCity) {
    await ctx.answerCbQuery("Город не найден");
    return;
  }
  ctx.session.cityId = selectedCityId;
  ctx.session.step = "wait_days";

  await ctx.answerCbQuery();
  await ctx.editMessageText(`🏙 Город выбран: ${selectedCity.name}`);
  await ctx.reply("🗓 На сколько дней вы туда собираетесь?");
});

loadCities();
bot.launch();
console.log("🚀 Bot started");

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
