import { chromium, type Browser, type Page } from "playwright";

import { scraperConfig } from "./config.js";
import { parseListingItem, type RawListingItem } from "./utils/listingParser.js";
import type { Book } from "../../types/book.js";
import { delay } from "./utils/delay.js";
import { getNextPageUrl } from "./utils/getNextPageUrl.js";
import { getBookDescription } from "./utils/getBookDescription.js";

export class BookScraper {
  private browser: Browser | null = null;

  async execute(): Promise<Book[]> {
    this.browser = await chromium.launch({ headless: scraperConfig.headless });
    const context = await this.browser.newContext({
      userAgent: scraperConfig.userAgent,
    });
    const page = await context.newPage();

    try {
      const books: Book[] = [];
      let pageUrl: string | null = scraperConfig.baseUrl;

      while (pageUrl) {
        await page.goto(pageUrl, { waitUntil: "domcontentloaded" });
        const pageBooks = await this.extractBooksFromPage(page);
        books.push(...pageBooks);

        pageUrl = await getNextPageUrl(page);
        if (pageUrl) {
          await delay(scraperConfig.requestDelayMs);
        }
      }

      for (const book of books) {
        const description = await getBookDescription(page, book.url);
        book.content = description;
      }

      return books;
    } finally {
      await context.close();
      await this.close();
    }
  }

  private async extractBooksFromPage(page: Page): Promise<Book[]> {
    const rawItems = await page.$$eval("article.product_pod", (articles) =>
      articles.map((article) => {
        const titleLink = article.querySelector("h3 a");
        const priceEl = article.querySelector("p.price_color");
        const availabilityEl = article.querySelector("p.instock.availability");
        const ratingEl = article.querySelector("p.star-rating");

        if (!titleLink || !priceEl || !availabilityEl || !ratingEl) {
          throw new Error("Estrutura inesperada na listagem de livros");
        }

        return {
          title: titleLink.textContent ?? "",
          price: priceEl.textContent ?? "",
          availability: availabilityEl.textContent ?? "",
          starRatingClass: ratingEl.className,
          relativeUrl: titleLink.getAttribute("href") ?? "",
          metadata: {
            categories: [],
            description: "",
          },
          description: "",
        } satisfies RawListingItem;
      }),
    );

    return rawItems.map((item) => parseListingItem(item, page.url()));
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
 
}
