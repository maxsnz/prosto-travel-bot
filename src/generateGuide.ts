import { askGPT } from "./askGPT";
import { saveToFile } from "./utils/saveToFile";
import { sendTelegramMessage } from "./utils/sendTelegramMessage";
import { cityService } from "./services";
import env from "./config/env";

export async function generateGuide({
  chatId,
  cityId,
  days,
}: {
  chatId: number;
  cityId: number;
  days: number;
}) {
  try {
    const city = await cityService.getCityById(cityId);

    // const guide = await askGPT({ city, days });
    const guide = "test";

    const filepath = `tmp/${Date.now()}.txt`;
    await saveToFile(guide, filepath);
    // generate Guide html
    // go to strapi api, create new Guide
    // send link to Guide to user
    const guideId = 1;
    const message = `🔗 [Посмотреть гид](${env.STRAPI_HOST}/guides/${guideId})`;
    await sendTelegramMessage(chatId, message);
  } catch (err) {
    console.error("Error getting places:", err);
  }
}
