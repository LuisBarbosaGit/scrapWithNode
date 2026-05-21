import "dotenv/config";

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // URL usada pelo CLI (migrate). Fallback para `prisma generate` sem .env.
    url:
      process.env.DATABASE_URL ??
      "postgresql://crawler:crawler@localhost:5432/crawlerdb?schema=public",
  },
});
