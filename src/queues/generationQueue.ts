import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { fsmStore } from "../fsm/store";
import {
  sendTelegramMessage,
  createInlineKeyboard,
} from "../utils/sendTelegramMessage";

const connection = new IORedis({
  maxRetriesPerRequest: null,
});

export const generateGuideQueue = new Queue("generate-guide-request", {
  connection,
});
export const guideGenerationSuccessQueue = new Worker(
  "generate-guide-response",
  async (job) => {
    const { isSuccess, guideId, userId, guideHash } = job.data;

    if (isSuccess) {
      console.log("[BOT] Guide generation success:", guideId, userId);

      // Update FSM state
      await fsmStore.update(userId, { step: "done" });
      await fsmStore.update(userId, { guideHash: guideHash });

      // Send message to user with inline keyboard
      await sendTelegramMessage(
        userId,
        "🎉 Твой гид готов! Нажми кнопку ниже, чтобы получить его.",
        createInlineKeyboard([
          [
            {
              text: "Получить гид",
              callback_data: "get_guide",
            },
          ],
        ])
      );
    } else {
      console.log("[BOT] Guide generation error:", guideId, userId);

      // Update FSM state
      await fsmStore.update(userId, { step: "generation_error" });

      // Send message to user with inline keyboard
      await sendTelegramMessage(
        userId,
        "🚨 Произошла ошибка при генерации гида. Попробуйте еще раз.",
        createInlineKeyboard([
          [
            {
              text: "Попробовать снова",
              callback_data: "restart",
            },
          ],
        ])
      );
    }
  },
  { connection }
);

export const guideGenerationErrorQueue = new Worker(
  "generate-guide-error",
  async (job) => {
    const { guideId, userId } = job.data;
  },
  { connection }
);
