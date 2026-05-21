import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Book } from "../types/book.js";

export async function exportToJson(
  books: Book[],
  outputDir: string,
  filename = "books.json",
): Promise<string> {
  await mkdir(outputDir, { recursive: true });
  const filePath = path.join(outputDir, filename);
  await writeFile(filePath, JSON.stringify(books, null, 2), "utf-8");
  return filePath;
}
