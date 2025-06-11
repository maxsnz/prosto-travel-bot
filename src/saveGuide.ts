import fetch from "node-fetch";
import { randomBytes } from "crypto";
import env from "./config/env";

type SaveGuideParams = {
  userId: number;
  cityId: number;
  prompt: string;
  completion: Record<string, any>;
  templateVersion: string;
  htmlContent: string;
};

export async function saveGuide(params: SaveGuideParams): Promise<string> {
  const publicId = randomBytes(12).toString("hex");

  const res = await fetch(`${env.STRAPI_HOST}/api/guides`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.STRAPI_TOKEN}`,
    },
    body: JSON.stringify({
      data: {
        user: params.userId,
        city: params.cityId,
        prompt: params.prompt,
        completion: params.completion,
        publicId,
        templateVersion: params.templateVersion,
        htmlContent: params.htmlContent,
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `Failed to create guide: ${res.status} ${res.statusText}\n${errorText}`
    );
  }

  const json = (await res.json()) as { publicId: string };
  return json.publicId;
}
