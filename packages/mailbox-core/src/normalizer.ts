import type { EmailAddress, MessageFlags } from "@ymail-mcp/shared-types";

/**
 * Parse an RFC 5322 address string into an EmailAddress object.
 * Handles: "Name <email@example.com>", "email@example.com", "Name" <email>
 */
export function parseEmailAddress(raw: string): EmailAddress {
  // "Name <email@example.com>"
  const angleMatch = raw.match(/^(.*?)\s*<([^>]+)>$/);
  if (angleMatch) {
    const name = angleMatch[1].replace(/^["']|["']$/g, "").trim();
    return { name: name || undefined, email: angleMatch[2].trim().toLowerCase() };
  }
  // Plain email
  return { email: raw.trim().toLowerCase() };
}

/**
 * Parse a list of raw address strings.
 */
export function parseEmailAddresses(
  raws: string | string[] | undefined
): EmailAddress[] {
  if (!raws) return [];
  const list = Array.isArray(raws) ? raws : [raws];
  return list
    .flatMap((r) => r.split(","))
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseEmailAddress);
}

/**
 * Normalize IMAP flags array to a typed MessageFlags object.
 * IMAP flags: \Seen, \Flagged, \Answered, \Draft
 */
export function parseImapFlags(flags: string[]): MessageFlags {
  const flagSet = new Set(flags.map((f) => f.toLowerCase()));
  return {
    seen: flagSet.has("\\seen"),
    flagged: flagSet.has("\\flagged"),
    answered: flagSet.has("\\answered"),
    draft: flagSet.has("\\draft"),
  };
}

/**
 * Generate a snippet (first 200 chars of plain text body).
 */
export function makeSnippet(text: string | undefined, maxLength = 200): string {
  if (!text) return "";
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.slice(0, maxLength).trimEnd() + "…";
}
