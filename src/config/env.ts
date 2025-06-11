import * as dotenv from "dotenv";

dotenv.config();

interface EnvironmentConfig {
  NODE_ENV: string;
  TELEGRAM_TOKEN: string;
  OPENAI_API_KEY: string;
  REDIS_URL: string;
  STRAPI_TOKEN: string;
  STRAPI_HOST: string;
}

function validateEnv(): EnvironmentConfig {
  const requiredVars = [
    "TELEGRAM_TOKEN",
    "OPENAI_API_KEY",
    "STRAPI_TOKEN",
    "STRAPI_HOST",
  ];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}`
    );
  }

  return {
    NODE_ENV: process.env.NODE_ENV || "development",
    TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN!,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
    REDIS_URL: process.env.REDIS_URL!,
    STRAPI_TOKEN: process.env.STRAPI_TOKEN!,
    STRAPI_HOST: process.env.STRAPI_HOST!,
  };
}

export const env = validateEnv();
export default env;
