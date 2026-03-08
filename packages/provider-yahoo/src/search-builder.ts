import type { SearchMessagesInput } from "@ymail-mcp/shared-types";

/**
 * Build an imapflow-compatible search criteria object from SearchMessagesInput.
 *
 * imapflow SearchObject reference:
 * https://imapflow.com/module-imapflow-ImapFlow.html#~SearchObject
 */
export function buildImapSearchCriteria(
  input: Omit<SearchMessagesInput, "folder" | "limit">
): Record<string, unknown> {
  const criteria: Record<string, unknown> = {};
  const andCriteria: unknown[] = [];

  if (input.query) {
    // Search in body and subject
    andCriteria.push({ or: [{ text: input.query }, { subject: input.query }] });
  }

  if (input.from) {
    andCriteria.push({ from: input.from });
  }

  if (input.subject) {
    andCriteria.push({ subject: input.subject });
  }

  if (input.since) {
    andCriteria.push({ since: new Date(input.since) });
  }

  if (input.before) {
    andCriteria.push({ before: new Date(input.before) });
  }

  if (input.unreadOnly) {
    andCriteria.push({ seen: false });
  }

  if (andCriteria.length === 0) {
    return { all: true };
  }

  if (andCriteria.length === 1) {
    return andCriteria[0] as Record<string, unknown>;
  }

  // Combine with AND (imapflow uses nested structure)
  // For multiple criteria, combine them at the top level (implicit AND in imapflow)
  let combined = andCriteria[0] as Record<string, unknown>;
  for (let i = 1; i < andCriteria.length; i++) {
    combined = { and: [combined, andCriteria[i]] };
  }

  return combined;
}
