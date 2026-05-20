import { env } from "./config/env";

import { BookScraper } from "./modules/scraper/bookScraper";
import { AgentProcessor } from "./modules/agentProcessor/agentProcessor";
import { getOpenAiClient } from "./infra/agent/client";
import { exportToJson } from "./utils/exportJson";

async function start(): Promise<void> {
  const scraper = new BookScraper();
  const agentClient = getOpenAiClient();
  const agentProcessor = new AgentProcessor(agentClient);

  try {
    console.log("Iniciando scraping de books.toscrape.com...\n");
    const books = await scraper.execute();

    await agentProcessor.execute(books);

    const jsonPath = await exportToJson(books, env.OUTPUT_DIR);

    console.log(`\nJSON: ${jsonPath}`);
    console.log("\nAmostra:");
    console.log(JSON.stringify(books.slice(0, 2), null, 2));
  } catch (error) {
    console.error("Erro durante o scraping:", error);
    process.exitCode = 1;
  }
}

start();
