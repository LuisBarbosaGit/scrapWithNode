import { z } from "zod";

export const BookMetadataAgentSchema = z.object({
  categories: z
    .array(z.string().min(1))
    .min(1)
    .max(5)
    .describe("Inferred book genres or categories in English"),
  description: z
    .string()
    .min(1)
    .describe("Brief raw description summary in English"),
});

export type BookMetadataAgentResult = z.infer<typeof BookMetadataAgentSchema>;
