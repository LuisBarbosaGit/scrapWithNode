import type { Page } from "playwright";

import { getBookDescription } from "../utils/getBookDescription";

const BOOK_URL =
  "https://books.toscrape.com/catalogue/a-light-in-the-attic_1000/index.html";

function createMockPage(options: {
  textContent?: string | null;
  gotoError?: Error;
  textContentError?: Error;
}): Page {
  const textContent = jest.fn();
  if (options.textContentError) {
    textContent.mockRejectedValue(options.textContentError);
  } else {
    textContent.mockResolvedValue(options.textContent ?? null);
  }

  const locator = jest.fn().mockReturnValue({ textContent });
  const goto = options.gotoError
    ? jest.fn().mockRejectedValue(options.gotoError)
    : jest.fn().mockResolvedValue(undefined);

  return { goto, locator } as unknown as Page;
}

describe("getBookDescription", () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("navega até a URL do livro e extrai a descrição", async () => {
    const page = createMockPage({
      textContent: "  It's a story about light.  ",
    });

    const description = await getBookDescription(page, BOOK_URL);

    expect(page.goto).toHaveBeenCalledWith(BOOK_URL, {
      waitUntil: "domcontentloaded",
    });
    expect(page.locator).toHaveBeenCalledWith("#product_description + p");
    expect(description).toBe("It's a story about light.");
  });

  it('retorna fallback quando não há texto na descrição', async () => {
    const page = createMockPage({ textContent: null });

    const description = await getBookDescription(page, BOOK_URL);

    expect(description).toBe("Descrição não disponível");
  });

  it("retorna fallback quando a navegação falha", async () => {
    const page = createMockPage({
      gotoError: new Error("timeout"),
    });

    const description = await getBookDescription(page, BOOK_URL);

    expect(description).toBe("Descrição não disponível");
    expect(warnSpy).toHaveBeenCalledWith(
      `Aviso: Não foi possível pegar a descrição em ${BOOK_URL}`,
      expect.any(Error),
    );
  });

  it("retorna fallback quando a leitura do seletor falha", async () => {
    const page = createMockPage({
      textContentError: new Error("locator timeout"),
    });

    const description = await getBookDescription(page, BOOK_URL);

    expect(description).toBe("Descrição não disponível");
    expect(warnSpy).toHaveBeenCalled();
  });
});
