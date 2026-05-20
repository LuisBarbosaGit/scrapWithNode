import OpenAI from "openai";
import { Book } from "../../types/book";
import { extractBookMetadata } from "./utils/extractMetadata";
import { env } from "../../config/env";

const MAX_BOOKS = 2;

export class AgentProcessor {
  private client: OpenAI;

  constructor(client: OpenAI) {
    this.client = client;
  }

  async execute(books: Book[]): Promise<void> {
    let numberOfBooksProcessed = 0;

    for (const book of books) {
      if (!book.content || book.content === "Descrição não disponível") {
        continue;
      }

      if (MAX_BOOKS && numberOfBooksProcessed >= MAX_BOOKS) {
        break;
      }

      try {
        if (env.SKIP_LLM) {
          book.metadata = {
            categories: [],
            description: "",
          };
          continue;
        }
        console.log(`Processing book "${book.title}"...`);
        book.metadata = await extractBookMetadata(book.content, this.client);
        console.log(`Book metadata extracted:`, book.metadata);
        console.log(`--------------------------------`);
        numberOfBooksProcessed++;
      } catch (error) {
        console.warn(`IA falhou para "${book.title}":`, error);
      }
    }
  }
}
