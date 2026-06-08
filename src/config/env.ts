import "dotenv/config";

import { z } from "zod";

const envSchema = z
  .object({
    OPENAI_API_KEY: z.string().min(1).optional(),
    OPENAI_MODEL: z.string().default("gpt-4o-mini"),
    OPENAI_MAX_TOKENS: z.coerce.number().int().positive().default(120),
    OUTPUT_DIR: z.string().default("output"),
    DATABASE_URL: z.string().min(1).optional(),
    PORT: z.coerce.number().int().positive().default(3000),
    SKIP_LLM: z
      .enum(["true", "false"])
      .optional(),
    SAVE_DATA: z
    .enum(["true", "false"])
    .optional()
  });

export const env = envSchema.parse(process.env);
