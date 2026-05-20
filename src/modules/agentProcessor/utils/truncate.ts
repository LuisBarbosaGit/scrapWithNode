const DEFAULT_MAX_CHARS = 900;

export function truncateForLlm(
  text: string,
  maxChars = DEFAULT_MAX_CHARS,
): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxChars) return normalized;
  return `${normalized.slice(0, maxChars)}…`;
}
