# CrawlerDesafio

Web scraper em **Node.js + TypeScript** para extrair livros de [books.toscrape.com](https://books.toscrape.com/). O pipeline coleta dados da listagem e das páginas de detalhe, enriquece metadados via **OpenAI** (opcional), persiste em **PostgreSQL** (Prisma) e exporta **JSON**.

---

## Sumário

- [Requisitos](#requisitos)
- [Configuração](#configuração)
- [Executar localmente (sem Docker)](#executar-localmente-sem-docker)
- [Executar com Docker](#executar-com-docker)
- [Scripts disponíveis](#scripts-disponíveis)
- [Schema de dados](#schema-de-dados)
- [Pipeline CI/CD (GitLab)](#pipeline-cicd-gitlab)
- [Decisões técnicas](#decisões-técnicas)
- [Próximos passos](#próximos-passos)
- [Prompts utilizados](#prompts-utilizados)

---

## Requisitos

| Ambiente | Versão |
|----------|--------|
| Node.js | 22+ (recomendado) |
| npm | 10+ |
| Docker + Compose | opcional (persistência e deploy) |
| Chromium (Playwright) | instalado via `npx playwright install chromium` |

---

## Configuração

```bash
git clone <url-do-repositorio>
cd CrawlerDesafio
cp .env.example .env
npm install
npx playwright install chromium
```

Edite o `.env` conforme a tabela abaixo. Variáveis validadas com **Zod** em `src/config/env.ts`.

| Variável | Obrigatória | Padrão | Descrição |
|----------|-------------|--------|-----------|
| `OPENAI_API_KEY` | Sim*, | — | Chave da OpenAI |
| `OPENAI_MODEL` | Não | `gpt-4o-mini` | Modelo para extração de metadados |
| `OPENAI_MAX_TOKENS` | Não | `120` | Limite de tokens na resposta |
| `SKIP_LLM` | Não | `false` | `true` = pula chamadas à API (mock local) |
| `OUTPUT_DIR` | Não | `output` | Pasta do arquivo JSON gerado |
| `DATABASE_URL` | Não | — | URL PostgreSQL (ativa persistência no banco) |
| `PORT` | Não | `3000` | Porta do endpoint `/health` |

\* Não obrigatória quando `SKIP_LLM=true`.

---

## Executar localmente (sem Docker)

### 1. Apenas scrape + JSON (sem banco)

```bash
# Remova ou comente DATABASE_URL no .env
SKIP_LLM=true npm run dev
```

Saída esperada: `output/books.json` e logs no terminal.

### 2. Com PostgreSQL local

Suba o banco (ex.: só o serviço Postgres do Compose):

```bash
docker compose up postgres -d
```

Configure no `.env`:

```env
DATABASE_URL=postgresql://crawler:crawler@localhost:5432/crawlerdb?schema=public
```

Aplique migrations e rode o scraper:

```bash
npm run db:migrate
npm run dev
# ou, após build:
npm run build && npm run start
```

### 3. Qualidade de código

```bash
npm run lint
npm run test
```

### 4. Inspecionar o banco (Prisma Studio)

Com o Postgres do Docker exposto em `localhost:5432`:

```bash
npm run db:studio
```

Abre em [http://localhost:5555](http://localhost:5555).

---

## Executar com Docker

### Stack completa (scraper + PostgreSQL)

```bash
cp .env.example .env
# Ajuste OPENAI_API_KEY ou SKIP_LLM=true

docker compose up --build
```

O que acontece:

1. **postgres** sobe com healthcheck na porta `5432`.
2. **scraper** aguarda o banco, executa `prisma migrate deploy`, roda o scraping e encerra (ou reinicia com `restart: on-failure`).
3. JSON fica no volume `scraper_output` (montado em `/app/output` no container).
4. Health check HTTP em `http://localhost:3000/health`.

### Apenas o banco (dev local)

```bash
docker compose up postgres -d
npm run db:migrate:dev   # primeira vez
npm run dev
```

### Variáveis úteis no Compose

| Variável | Padrão | Uso |
|----------|--------|-----|
| `POSTGRES_USER` | `crawler` | Usuário do Postgres |
| `POSTGRES_PASSWORD` | `crawler` | Senha |
| `POSTGRES_DB` | `crawlerdb` | Database |
| `POSTGRES_PORT` | `5432` | Porta exposta no host |
| `SCRAPER_PORT` | `3000` | Porta do health server |
| `SKIP_LLM` | `false` | Desativa IA no container |

---

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Scrape em modo desenvolvimento (`tsx`) |
| `npm run build` | Compila TypeScript → `dist/` |
| `npm run start` | Executa `dist/index.js` |
| `npm run lint` | ESLint em `src/` |
| `npm run test` | Testes Jest |
| `npm run db:generate` | Gera Prisma Client |
| `npm run db:migrate` | Aplica migrations (produção/CI) |
| `npm run db:migrate:dev` | Cria/aplica migrations (dev) |
| `npm run db:studio` | Prisma Studio → Postgres em `localhost` (Docker) |

---

## Schema de dados

### JSON (`output/books.json`)

Array de objetos `Book`. Exemplo:

```json
{
  "title": "A Light in the Attic",
  "price": 51.77,
  "availability": "In stock",
  "content": "It's hard to imagine a world without...",
  "rating": 3,
  "url": "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html",
  "metadata": {
    "categories": ["Poetry", "Fiction"],
    "description": "A poetry collection exploring everyday wonder."
  }
}
```

| Campo | Tipo | Origem | Descrição |
|-------|------|--------|-----------|
| `title` | `string` | Listagem | Título do livro |
| `price` | `number` | Listagem | Preço numérico (ex.: `£51.77` → `51.77`) |
| `availability` | `string` | Listagem | Texto de disponibilidade |
| `content` | `string` | Página de detalhe | Descrição completa do site |
| `rating` | `number` (1–5) | Listagem | Estrelas convertidas de `star-rating One`…`Five` |
| `url` | `string` | Listagem | URL absoluta do livro |
| `metadata` | `object?` | OpenAI | Presente após enriquecimento com IA |
| `metadata.categories` | `string[]` | IA | Gêneros/categorias inferidos (inglês) |
| `metadata.description` | `string` | IA | Resumo curto em inglês |

> **Nota:** `metadata` é opcional; com `SKIP_LLM=true` pode vir vazio ou ausente nos primeiros livros processados.

### PostgreSQL (Prisma — tabela `books`)

Persistência **sem** o campo `content` (apenas scrape em memória + JSON).

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | `SERIAL` | PK |
| `title` | `TEXT` | Título |
| `price` | `DECIMAL(10,2)` | Preço |
| `availability` | `TEXT` | Disponibilidade |
| `rating` | `INTEGER` | 1–5 |
| `url` | `TEXT` (único) | Chave de upsert |
| `metadata` | `JSONB` | Metadados da IA |
| `createdAt` | `TIMESTAMP` | Criação |
| `updatedAt` | `TIMESTAMP` | Atualização |

---

## Pipeline CI/CD (GitLab)

Arquivo: [`.gitlab-ci.yml`](.gitlab-ci.yml)

```mermaid
flowchart LR
  lint[lint - ESLint] --> test[test - Jest]
  test --> build[build - Docker push]
  build --> deploy[deploy - echo ECS]
```

| Stage | Job | Regra | Ação |
|-------|-----|-------|------|
| `lint` | `lint` | sempre | `npm ci` + `npm run lint` — falha se houver erros ESLint |
| `test` | `test` | sempre | `prisma generate` + `npm run test` — falha se testes quebrarem |
| `build` | `build` | `main`, MR e demais branches | Build da imagem Docker e **push** para o GitLab Container Registry |
| `deploy` | `deploy` | **somente `main`** | Simula deploy na AWS ECS (`echo` dos comandos) |

### Registry e tags (variáveis nativas GitLab)

- `CI_REGISTRY` — host do registry
- `CI_REGISTRY_USER` / `CI_REGISTRY_PASSWORD` — autenticação
- `CI_REGISTRY_IMAGE` — ex.: `registry.gitlab.com/grupo/crawlerdesafio`
- Imagem versionada: `$CI_REGISTRY_IMAGE:$CI_COMMIT_SHORT_SHA`
- Tag `latest` publicada apenas na branch **main**

### Cache (bônus)

Jobs `lint` e `test` usam cache de `node_modules/` com chave baseada em `package-lock.json`, reduzindo tempo de `npm ci` entre pipelines.

### Deploy simulado (main)

O job `deploy` imprime os comandos equivalentes a:

```bash
aws ecs update-service \
  --cluster crawler-prod \
  --service crawler-scraper \
  --force-new-deployment
```

---

## Decisões técnicas

| Decisão | Justificativa |
|---------|---------------|
| **Playwright** | Renderiza o DOM real e já suporta páginas dinâmicas (bônus do desafio), além de paginação e navegação entre detalhes com uma única aba. |
| **TypeScript strict** | Tipos explícitos no domínio (`Book`), parsers e contratos da IA; menos erros em runtime. |
| **Zod (env + IA)** | Validação da configuração na subida e schema estruturado da resposta OpenAI (`zodTextFormat`). |
| **Módulos separados** | `scraper` (coleta), `agentProcessor` (IA), `repository` (Postgres), `infra` (DB, HTTP, agent) — testável e evolutivo. |
| **Prisma 7 + adapter `pg`** | Migrações versionadas, tipagem do client e JSONB para `metadata`; alinhado ao requisito de bônus PostgreSQL. |
| **`page.url()` na listagem** | Resolve URLs relativas corretamente em páginas paginadas. |
| **Docker multi-stage** | `alpine` para deps, `slim` para Playwright/Chromium; imagem final com usuário **não-root** e health na porta 3000. |
| **Jest + mocks** | Testes de parsing (preço, estrelas) e export sem browser; `getBookDescription` mockado. |
| **`SKIP_LLM`** | Permite CI, Docker e dev local sem custo de API. |

---

## Próximos passos

### Observabilidade

- **Logs estruturados** (JSON) com `pino` ou `winston`: `traceId`, URL, página, duração por etapa (listagem, detalhe, IA, persistência).
- **Métricas** (Prometheus/OpenTelemetry): livros coletados, falhas por seletor, latência Playwright, tokens OpenAI, registros gravados no Postgres.
- **Tracing** distribuído para correlacionar scrape → IA → DB em uma única execução.
- **Alertas** no pipeline (GitLab) e em produção: taxa de erro, scraper sem conclusão, migrações pendentes.

### Defesas anti-bot

- **Rate limiting** configurável entre páginas (`requestDelayMs`) e jitter aleatório.
- **Rotação de User-Agent** e headers realistas no `browserContext`.
- **Retry com backoff exponencial** em timeouts e HTTP 429/503.
- **Proxies residenciais/datacenter** opcionais via variável de ambiente.
- **Detecção de bloqueio** (CAPTCHA, resposta vazia) com falha graciosa e métrica dedicada.
- **Filas de trabalho** (BullMQ/SQS) para reprocessar apenas livros falhos sem re-scrape completo.

### Outras melhorias

- GitLab CI: scan de imagem (Trivy) e deploy real no ECS com task definition versionada.
- Testes e2e com fixtures HTML do site para regressão de seletores.

---

## Estrutura do projeto

```
src/
  config/                 # env validada (Zod)
  index.ts                # orquestração do pipeline
  types/book.ts           # interface Book
  modules/
    scraper/              # Playwright, parsers, repository Postgres
    agentProcessor/       # enriquecimento OpenAI
  infra/
    db/                   # Prisma client + schema/migrations
    agent/                # cliente OpenAI
    http/                 # health server
  utils/exportJson.ts     # exportação JSON
prisma.config.ts          # URL do banco (Prisma 7)
docker-compose.yml
Dockerfile
.gitlab-ci.yml
```

---

## Prompts utilizados

<!-- Preencha com os prompts que você utilizou nesta IDE / desafio -->

| # | Contexto | Prompt |
|---|----------|--------|
| 1 | | |Utilizei um agente para resumir o desafio, elencar passo a passo do projeto, e criar um plano de ação.
| 2 | | |Configurei o projeto, criando um contexto geral do desafio.
| 3 | | |Utilizando agentes especializados, construi o projeto passo a passo, estruturando com melhores pratícas.

IAS utilizadas

Gemini & Cursor

---

## Licença

ISC
