import { env } from "./config/env.js";

import { BookScraper } from "./modules/scraper/bookScraper.js";
import { AgentProcessor } from "./modules/agentProcessor/agentProcessor.js";
import { getOpenAiClient } from "./infra/agent/client.js";
import { startHealthServer } from "./infra/http/healthServer.js";
import { disconnectPrisma } from "./infra/db/client.js";
import { persistBooks } from "./modules/scraper/repository/bookRepository.js";
import { exportToJson } from "./utils/exportJson.js";

async function start(): Promise<void> {
  const healthServer = startHealthServer(env.PORT);
  const scraper = new BookScraper();
  const agentClient = getOpenAiClient();
  const agentProcessor = new AgentProcessor(agentClient);

  try {
    console.log("Iniciando scraping de books.toscrape.com...\n");
    const books = await scraper.execute();

    await agentProcessor.execute(books);

    if (env.DATABASE_URL) {
      const saved = await persistBooks(books);
      console.log(`\nPostgreSQL: ${saved} livro(s) persistido(s).`);
    }

    await exportToJson(books, env.OUTPUT_DIR);
  } catch (error) {
    console.error("Erro durante o scraping:", error);
    process.exitCode = 1;
  } finally {
    await disconnectPrisma();
    healthServer.close();
  }
}

start();
