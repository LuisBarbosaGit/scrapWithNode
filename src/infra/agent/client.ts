import OpenAI from "openai";

import { env } from "../../config/env";

let client: OpenAI | null = null;

export function getOpenAiClient(): OpenAI {
  if (!env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY não configurada");
  }

  if (!client) {
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }

  return client;
}
