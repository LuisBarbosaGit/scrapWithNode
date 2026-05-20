# CrawlerDesafio

Scraper em Node.js + TypeScript para [books.toscrape.com](https://books.toscrape.com), com exportação JSON/CSV e enriquecimento via OpenAI.

## Requisitos

- Node.js 20+
- Chromium do Playwright: `npx playwright install chromium`

## Configuração

```bash
cp .env.example .env
npm install
```

| Variável | Descrição |
|----------|-----------|
| `OPENAI_API_KEY` | Chave da OpenAI (obrigatória se `SKIP_LLM` não estiver ativo) |
| `OPENAI_MODEL` | Modelo (padrão: `gpt-4o-mini`) |
| `OPENAI_MAX_TOKENS` | Limite de tokens na resposta (padrão: `120`) |
| `OUTPUT_DIR` | Pasta de saída (padrão: `output`) |
| `SKIP_LLM` | `true` = mock local, sem API |
| `MAX_BOOKS_LLM` | Limita quantos livros passam pela IA |

Variáveis validadas com **Zod** em `src/config/env.ts`.

## Executar

```bash
npm run dev    # scrape + IA + export
npm run lint
npm run build && npm run start
```

## Estrutura

```
src/
  config/env.ts       # env validada (Zod)
  scraper/            # Playwright
  parser/             # preço, rating, URLs
  persistence/        # export JSON e CSV
  services/           # orquestra enriquecimento IA
infra/agent/          # cliente OpenAI + extração de metadados
output/               # books.json, books.csv (gerado)
```

## Schema de saída

**JSON** — array de livros:

```json
{
  "title": "string",
  "price": 51.77,
  "availability": "In stock",
  "description": "texto original do site",
  "rating": 3,
  "url": "https://...",
  "ai": {
    "categories": ["Science Fiction", "Adventure"],
    "description": "Short English summary."
  }
}
```

## IA (`infra/agent`)

Schema Zod (`BookMetadataAgentSchema`) com `categories` e `description`. A saída é controlada via `responses.parse` + `zodTextFormat`:

```ts
text: { format: zodTextFormat(BookMetadataAgentSchema, "book_metadata") }
```

**Economia de tokens:**

- Modelo leve (`gpt-4o-mini`)
- Descrição truncada (~900 caracteres)
- `max_output_tokens` baixo
- Structured Outputs (sem parser manual de texto)
- Prompt mínimo
- `MAX_BOOKS_LLM` para testes

Com `SKIP_LLM=true`, usa mock local (sem custo de API).

## Decisões técnicas

| Escolha | Motivo |
|---------|--------|
| **Playwright** | Suporta páginas dinâmicas (bônus) e DOM real |
| **URLs com `page.url()`** | Links relativos corretos em páginas paginadas |
| **OpenAI + zodTextFormat** | Saída tipada e validada pelo schema Zod |
| **Zod na env e na resposta IA** | Falha cedo em config ou payload inválido |
| **`infra/agent` separado** | Integração LLM isolada do scrape |

## Próximos passos

- Testes Jest (parsing, export, mock da IA)
- Docker + PostgreSQL
- Pipeline GitLab CI/CD
- Observabilidade (logs estruturados, métricas)
- Rate limiting e retry na API OpenAI

## Prompts utilizados

<!-- Preencha com os prompts usados nesta IDE -->
