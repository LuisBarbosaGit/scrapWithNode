import "dotenv/config";

import { z } from "zod";

const envSchema = z
  .object({
    OPENAI_API_KEY: z.string().min(1).optional(),
    OPENAI_MODEL: z.string().default("gpt-4o-mini"),
    OPENAI_MAX_TOKENS: z.coerce.number().int().positive().default(120),
    OUTPUT_DIR: z.string().default("output"),
    SKIP_LLM: z
      .enum(["true", "false", "1", "0"])
      .optional()
      .transform((v) => v === "true" || v === "1"),
  })
  .refine((data) => data.SKIP_LLM === true || !!data.OPENAI_API_KEY, {
    message: "OPENAI_API_KEY é obrigatória quando SKIP_LLM não está ativo",
    path: ["OPENAI_API_KEY"],
  });

export const env = envSchema.parse(process.env);
