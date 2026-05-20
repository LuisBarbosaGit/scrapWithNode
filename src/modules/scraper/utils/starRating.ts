const WORD_TO_RATING: Record<string, number> = {
  One: 1,
  Two: 2,
  Three: 3,
  Four: 4,
  Five: 5,
};

export function parseStarRating(classNames: string): number {
  const tokens = classNames.split(/\s+/);

  for (const token of tokens) {
    const rating = WORD_TO_RATING[token];
    if (rating !== undefined) {
      return rating;
    }
  }

  throw new Error(`Star rating não reconhecido: "${classNames}"`);
}
