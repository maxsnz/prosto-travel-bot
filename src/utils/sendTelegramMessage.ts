import fetch from "node-fetch";
import env from "../config/env";

export interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export function createInlineKeyboard(
  buttons: InlineKeyboardButton[][]
): InlineKeyboardMarkup {
  return {
    inline_keyboard: buttons,
  };
}

export async function sendTelegramMessage(
  chatId: number,
  text: string,
  replyMarkup?: InlineKeyboardMarkup
) {
  const token = env.TELEGRAM_TOKEN;

  const body: any = {
    chat_id: chatId,
    text: text,
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    console.error("Error sending message:", res.statusText);
    return;
  }

  return await res.json();
}
