import fetch from "node-fetch";
import env from "../config/env";

export async function sendTelegramMessage(chatId: number, text: string) {
  const token = env.TELEGRAM_TOKEN;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
    method: "POST",
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
    }),
  });

  if (!res.ok) {
    console.error("Error sending message:", res.statusText);
    return;
  }
}
