import fetch from "node-fetch";
import { env } from "./config/env";

type FindOrCreateUserParams = {
  telegramId: number;
  username?: string;
  firstName?: string;
};

type StrapiUser = {
  id: number;
  telegramId: string;
  username?: string;
  firstName?: string;
  email?: string;
};

export async function findOrCreateUser({
  telegramId,
  username,
  firstName,
}: FindOrCreateUserParams): Promise<number> {
  const res = await fetch(`${env.STRAPI_HOST}/api/telegram-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.STRAPI_TOKEN}`,
    },
    body: JSON.stringify({
      telegramId,
      username,
      firstName,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Failed to find or create user: ${res.status} ${res.statusText}\n${errorText}`
    );
  }

  const user: StrapiUser = (await res.json()) as StrapiUser;

  if (!user.id) {
    throw new Error("Invalid response from Strapi: missing user ID");
  }

  return user.id;
}
