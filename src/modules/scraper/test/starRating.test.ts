import { parseStarRating } from "../utils/starRating";

describe("parseStarRating", () => {
  it.each([
    ["star-rating One", 1],
    ["star-rating Two", 2],
    ["star-rating Three", 3],
    ["star-rating Four", 4],
    ["star-rating Five", 5],
  ])('converte "%s" para %i', (classNames, expected) => {
    expect(parseStarRating(classNames)).toBe(expected);
  });

  it("encontra a classe de estrela entre outras classes", () => {
    expect(parseStarRating("star-rating Three icon")).toBe(3);
  });

  it("lança erro quando a classificação não é reconhecida", () => {
    expect(() => parseStarRating("star-rating Unknown")).toThrow(
      'Star rating não reconhecido: "star-rating Unknown"',
    );
  });
});
