import { parseListingItem, parsePrice } from "../utils/listingParser";
import type { RawListingItem } from "../utils/listingParser";

describe("parsePrice", () => {
  it("converte preço em libra para número", () => {
    expect(parsePrice("£51.77")).toBe(51.77);
  });

  it("aceita valores com centavos", () => {
    expect(parsePrice("£0.99")).toBe(0.99);
  });

  it("ignora espaços em branco", () => {
    expect(parsePrice("  £12.34  ")).toBe(12.34);
  });

  it("lança erro para preço inválido", () => {
    expect(() => parsePrice("sem preço")).toThrow('Preço inválido: "sem preço"');
  });
});

describe("parseListingItem", () => {
  const baseItem: RawListingItem = {
    title: "  Um Livro  ",
    price: "£10.00",
    description: "  Descrição do livro  ",
    availability: " In stock ",
    starRatingClass: "star-rating Four",
    relativeUrl: "a-light-in-the-attic_1000/index.html",
    metadata: { categories: ["Fiction"], description: "Resumo" },
  };

  it("normaliza campos e monta URL absoluta", () => {
    const book = parseListingItem(
      baseItem,
      "https://books.toscrape.com/catalogue/page-1.html",
    );

    expect(book).toEqual({
      title: "Um Livro",
      price: 10,
      content: "Descrição do livro",
      availability: "In stock",
      rating: 4,
      url: "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html",
      metadata: { categories: ["Fiction"], description: "Resumo" },
    });
  });
});
