import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";

const connection = new IORedis({
  maxRetriesPerRequest: null,
});

export const generateGuideQueue = new Queue("generate-guide", { connection });
export const guideGeneratedQueue = new Worker(
  "guide-generated",
  async (job) => {
    const { guideId, htmlContent } = job.data;

    console.log("[BOT] Guide generated:", guideId);

    // For example, update Strapi via REST or directly
    // await updateStrapiGuide(guideId, { status: 'ready', htmlContent });

    // Or notify the user
    // await notifyUser(guideId, 'Your guide is ready!');
  },
  { connection }
);
