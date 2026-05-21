import { zodTextFormat } from "openai/helpers/zod";

import { env } from "../../../config/env.js";
import { BookMetadataAgentSchema } from "../../../schemas/bookMetadataSchema.js";
import { normalizeText } from "./truncate.js";
import type { BookMetadataResult } from "../types.js";
import OpenAI from "openai";

const SCHEMA_NAME = "book_metadata";

const SYSTEM_PROMPT =
  "You analyze book descriptions. Infer genres and summarize the plot. Write in English only.";

const USER_PROMPT_PREFIX = "Book description:\n\n";

function mockMetadata(description: string): BookMetadataResult {
  const snippet = normalizeText(description, 200);
  return {
    categories: ["General Fiction"],
    description: snippet || "No description available.",
  };
}

export async function extractBookMetadata(
  description: string,
  agent: OpenAI,
): Promise<BookMetadataResult> {
  if (env.SKIP_LLM) {
    return mockMetadata(description);
  }
  const input = normalizeText(description);

  const response = await agent.responses.parse({
    model: env.OPENAI_MODEL,
    instructions: SYSTEM_PROMPT,
    input: `${USER_PROMPT_PREFIX}${input}`,
    max_output_tokens: env.OPENAI_MAX_TOKENS,
    text: {
      format: zodTextFormat(BookMetadataAgentSchema, SCHEMA_NAME),
    },
  });

  if (!response.output_parsed) {
    throw new Error("Resposta estruturada vazia da OpenAI");
  }

  return response.output_parsed;
}
