const DEFAULT_MAX_CHARS = 50_000;
const TRUNCATION_SUFFIX = "\n\n[...message truncated — use read_message for full content]";

/**
 * Truncates a message body to the specified maximum character count.
 * Tries to break at a sentence or paragraph boundary when possible.
 */
export function truncateBody(
  text: string,
  maxChars: number = DEFAULT_MAX_CHARS
): string {
  if (text.length <= maxChars) return text;

  // Try to break at a paragraph boundary within the last 10% of max chars
  const searchFrom = Math.floor(maxChars * 0.9);
  const paragraphBreak = text.lastIndexOf("\n\n", maxChars);
  const sentenceBreak = text.lastIndexOf(". ", maxChars);

  let breakPoint: number;
  if (paragraphBreak > searchFrom) {
    breakPoint = paragraphBreak;
  } else if (sentenceBreak > searchFrom) {
    breakPoint = sentenceBreak + 1; // include the period
  } else {
    breakPoint = maxChars;
  }

  return text.slice(0, breakPoint).trimEnd() + TRUNCATION_SUFFIX;
}

export { DEFAULT_MAX_CHARS };
