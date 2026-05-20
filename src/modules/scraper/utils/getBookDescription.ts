import { Page } from "playwright";

export const getBookDescription = async (
  page: Page,
  bookDetailUrl: string,
): Promise<string> => {
  try {
    // 1. Navega até a página específica do livro
    await page.goto(bookDetailUrl, { waitUntil: "domcontentloaded" });

    // 2. Tenta localizar a descrição usando o seletor de irmão (+)
    const descriptionLocator = page.locator("#product_description + p");

    // 3. Extrai o texto. Se o livro não tiver descrição, ele não quebra o código.
    const descriptionText = await descriptionLocator.textContent({
      timeout: 2000,
    });

    return descriptionText?.trim() ?? "Descrição não disponível";
  } catch (error) {
    // Caso a página não carregue ou a estrutura seja diferente
    console.warn(
      `Aviso: Não foi possível pegar a descrição em ${bookDetailUrl}`,
      error,
    );
    return "Descrição não disponível";
  }
};
