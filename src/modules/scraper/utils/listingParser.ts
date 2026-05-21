import { parseStarRating } from "./starRating.js";
import type { Book, BookAiMetadata } from "../../../types/book.js";

export interface RawListingItem {
  title: string;
  price: string;
  description: string;
  availability: string;
  starRatingClass: string;
  relativeUrl: string;
  metadata: BookAiMetadata;
}

export function parsePrice(raw: string): number {
  const cleaned = raw.trim().replace(/[^\d.]/g, "");
  const value = Number.parseFloat(cleaned);

  if (!Number.isFinite(value)) {
    throw new Error(`Preço inválido: "${raw}"`);
  }

  return value;
}

export function parseListingItem(
  item: RawListingItem,
  listingPageUrl: string,
): Book {
  const url = new URL(item.relativeUrl, listingPageUrl).href;

  return {
    title: item.title.trim(),
    price: parsePrice(item.price),
    content: item.description.trim(),
    availability: item.availability.trim(),
    rating: parseStarRating(item.starRatingClass),
    url,
    metadata: item.metadata,
  };
}
