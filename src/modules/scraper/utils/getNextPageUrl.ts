import type { Page } from "playwright";

export const getNextPageUrl = async (page: Page): Promise<string | null> => {
  const nextHref = await page
    .locator("li.next a")
    .getAttribute("href")
    .catch(() => null);

  if (!nextHref) {
    return null;
  }

  return new URL(nextHref, page.url()).href;
}