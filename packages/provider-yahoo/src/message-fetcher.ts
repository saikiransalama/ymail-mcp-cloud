import type { ImapFlow } from "imapflow";
import type { MessageSummary, NormalizedMessage } from "@ymail-mcp/shared-types";
import {
  makeSnippet,
  parseEmailAddresses,
  parseImapFlags,
} from "@ymail-mcp/mailbox-core";
import { imapError } from "@ymail-mcp/mailbox-core";

export interface FetchMessagesOptions {
  folder: string;
  limit: number;
  cursor?: string;
  unreadOnly?: boolean;
}

export interface FetchMessagesResult {
  messages: MessageSummary[];
  nextCursor?: string;
}

/**
 * Fetch a list of message summaries from an IMAP folder.
 * Uses UID-based pagination via cursor.
 */
export async function fetchMessageList(
  client: ImapFlow,
  options: FetchMessagesOptions
): Promise<FetchMessagesResult> {
  const { folder, limit, cursor, unreadOnly } = options;

  try {
    const lock = await client.getMailboxLock(folder);
    try {
      // Build search criteria
      const searchCriteria: Record<string, unknown> = unreadOnly
        ? { seen: false }
        : { all: true };

      // Cursor is the last seen UID — fetch UIDs lower than cursor
      const allUids = await client.search(searchCriteria, { uid: true });

      if (!allUids || allUids.length === 0) {
        return { messages: [] };
      }

      // Sort descending (newest first)
      const sortedUids = [...allUids].sort((a, b) => b - a);

      // Apply cursor (cursor = last UID from previous page)
      let startIndex = 0;
      if (cursor) {
        const cursorUid = parseInt(cursor, 10);
        startIndex = sortedUids.findIndex((uid) => uid < cursorUid);
        if (startIndex === -1) return { messages: [] };
      }

      const pageUids = sortedUids.slice(startIndex, startIndex + limit);
      const nextCursorUid =
        startIndex + limit < sortedUids.length
          ? sortedUids[startIndex + limit]
          : undefined;

      if (pageUids.length === 0) return { messages: [] };

      const messages: MessageSummary[] = [];

      for await (const msg of client.fetch(pageUids.join(","), {
        uid: true,
        flags: true,
        envelope: true,
        bodyStructure: true,
      }, { uid: true })) {
        const env = msg.envelope;
        const flags = parseImapFlags(msg.flags ? [...msg.flags] : []);

        messages.push({
          id: String(msg.uid),
          uid: msg.uid,
          folder,
          subject: env?.subject ?? "(no subject)",
          from: parseEmailAddresses(env?.from?.map((a) => `${a.name ?? ""} <${a.address}>`) ?? []),
          to: parseEmailAddresses(env?.to?.map((a) => `${a.name ?? ""} <${a.address}>`) ?? []),
          date: (env?.date ?? new Date()).toISOString(),
          snippet: "",
          flags,
          hasAttachments: hasAttachment(msg.bodyStructure),
        });
      }

      return {
        messages,
        nextCursor: nextCursorUid ? String(nextCursorUid) : undefined,
      };
    } finally {
      lock.release();
    }
  } catch (err) {
    throw imapError(`Failed to list messages in ${folder}`, err);
  }
}

/**
 * Fetch the full content of a single message by UID.
 */
export async function fetchMessageByUid(
  client: ImapFlow,
  folder: string,
  uid: number
): Promise<NormalizedMessage> {
  try {
    const lock = await client.getMailboxLock(folder);
    try {
      let result: NormalizedMessage | null = null;

      for await (const msg of client.fetch(
        String(uid),
        {
          uid: true,
          flags: true,
          envelope: true,
          source: true,
          bodyStructure: true,
        },
        { uid: true }
      )) {
        const env = msg.envelope;
        const flags = parseImapFlags(msg.flags ? [...msg.flags] : []);
        const source = msg.source?.toString("utf8") ?? "";

        // Parse text and HTML parts from the raw source
        const { textBody, htmlBody } = parseBodyFromSource(source);

        result = {
          id: String(msg.uid),
          uid: msg.uid,
          folder,
          subject: env?.subject ?? "(no subject)",
          from: parseEmailAddresses(env?.from?.map((a) => `${a.name ?? ""} <${a.address}>`) ?? []),
          to: parseEmailAddresses(env?.to?.map((a) => `${a.name ?? ""} <${a.address}>`) ?? []),
          cc: parseEmailAddresses(env?.cc?.map((a) => `${a.name ?? ""} <${a.address}>`) ?? []),
          date: (env?.date ?? new Date()).toISOString(),
          snippet: makeSnippet(textBody),
          textBody,
          htmlBody,
          flags,
          hasAttachments: hasAttachment(msg.bodyStructure),
        };
        break;
      }

      if (!result) {
        throw imapError(`Message ${uid} not found in ${folder}`);
      }

      return result;
    } finally {
      lock.release();
    }
  } catch (err) {
    throw imapError(`Failed to read message ${uid} from ${folder}`, err);
  }
}

function hasAttachment(bodyStructure: unknown): boolean {
  if (!bodyStructure || typeof bodyStructure !== "object") return false;
  const bs = bodyStructure as { type?: string; disposition?: { type?: string }; childNodes?: unknown[] };

  if (
    bs.disposition?.type?.toLowerCase() === "attachment"
  ) {
    return true;
  }

  if (Array.isArray(bs.childNodes)) {
    return bs.childNodes.some(hasAttachment);
  }

  return false;
}

/**
 * Naive multipart parser — extracts text/plain and text/html from raw RFC 5322 source.
 * For production, consider using the `mailparser` package.
 */
function parseBodyFromSource(source: string): {
  textBody?: string;
  htmlBody?: string;
} {
  // Look for Content-Type boundaries in the email source
  const textMatch = source.match(
    /Content-Type:\s*text\/plain[^\r\n]*\r?\n(?:[^\r\n]+:\s*[^\r\n]*\r?\n)*\r?\n([\s\S]*?)(?=\r?\n--|\r?\n\r?\n--|\z)/i
  );
  const htmlMatch = source.match(
    /Content-Type:\s*text\/html[^\r\n]*\r?\n(?:[^\r\n]+:\s*[^\r\n]*\r?\n)*\r?\n([\s\S]*?)(?=\r?\n--|\r?\n\r?\n--|\z)/i
  );

  return {
    textBody: textMatch?.[1]?.trim(),
    htmlBody: htmlMatch?.[1]?.trim(),
  };
}
