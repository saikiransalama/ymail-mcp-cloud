import type { MailProvider, UserContext } from "@ymail-mcp/mailbox-core";
import {
  sanitizeEmailHtml,
  truncateBody,
} from "@ymail-mcp/mailbox-core";
import type {
  ListFoldersOutput,
  ListMessagesInput,
  ListMessagesOutput,
  SearchMessagesInput,
  SearchMessagesOutput,
  ReadMessageInput,
  ReadMessageOutput,
  SendMessageInput,
  SendMessageOutput,
  MessageActionInput,
  ActionResult,
} from "@ymail-mcp/shared-types";
import { createLogger } from "@ymail-mcp/observability";
import { withImap } from "./imap-client.js";
import { buildSmtpTransport } from "./smtp-client.js";
import { mapImapFolder, resolveFolder } from "./folder-mapper.js";
import {
  fetchMessageByUid,
  fetchMessageList,
} from "./message-fetcher.js";
import { sendViaSMTP } from "./message-sender.js";
import { clearSeenFlag, setSeenFlag } from "./flag-manager.js";
import { archiveMessage as archiveMsg } from "./archive-handler.js";
import { buildImapSearchCriteria } from "./search-builder.js";
import { makeSnippet, parseEmailAddresses, parseImapFlags } from "@ymail-mcp/mailbox-core";
import { imapError } from "@ymail-mcp/mailbox-core";

const logger = createLogger("yahoo-app-password-provider");

export class YahooAppPasswordProvider implements MailProvider {
  async listFolders(ctx: UserContext): Promise<ListFoldersOutput> {
    logger.debug({ userId: ctx.userId }, "listFolders");

    const folders = await withImap(ctx.userId, ctx.credentials, async (client) => {
      const folderList = await client.list();
      return folderList.map(mapImapFolder);
    });

    return { folders };
  }

  async listMessages(
    input: ListMessagesInput,
    ctx: UserContext
  ): Promise<ListMessagesOutput> {
    logger.debug({ userId: ctx.userId, folder: input.folder }, "listMessages");

    const folder = resolveFolder(input.folder);

    const result = await withImap(ctx.userId, ctx.credentials, async (client) => {
      return fetchMessageList(client, {
        folder,
        limit: input.limit,
        cursor: input.cursor,
        unreadOnly: input.unreadOnly,
      });
    });

    return {
      messages: result.messages,
      nextCursor: result.nextCursor,
      folder,
    };
  }

  async searchMessages(
    input: SearchMessagesInput,
    ctx: UserContext
  ): Promise<SearchMessagesOutput> {
    logger.debug({ userId: ctx.userId, query: input.query }, "searchMessages");

    const folder = resolveFolder(input.folder);
    const searchCriteria = buildImapSearchCriteria(input);

    const messages = await withImap(ctx.userId, ctx.credentials, async (client) => {
      try {
        const lock = await client.getMailboxLock(folder);
        const results = [];
        try {
          const uids = await client.search(searchCriteria, { uid: true });

          if (!uids || uids.length === 0) return [];

          // Take newest first, up to limit
          const sorted = [...uids].sort((a, b) => b - a).slice(0, input.limit);

          for await (const msg of client.fetch(
            sorted.join(","),
            { uid: true, flags: true, envelope: true, bodyStructure: true },
            { uid: true }
          )) {
            const env = msg.envelope;
            const flags = parseImapFlags(msg.flags ? [...msg.flags] : []);
            results.push({
              id: String(msg.uid),
              uid: msg.uid,
              folder,
              subject: env?.subject ?? "(no subject)",
              from: parseEmailAddresses(env?.from?.map((a) => `${a.name ?? ""} <${a.address}>`) ?? []),
              to: parseEmailAddresses(env?.to?.map((a) => `${a.name ?? ""} <${a.address}>`) ?? []),
              date: (env?.date ?? new Date()).toISOString(),
              snippet: "",
              flags,
              hasAttachments: false,
            });
          }
        } finally {
          lock.release();
        }
        return results;
      } catch (err) {
        throw imapError(`Search failed in ${folder}`, err);
      }
    });

    return { messages, total: messages.length, folder };
  }

  async readMessage(
    input: ReadMessageInput,
    ctx: UserContext
  ): Promise<ReadMessageOutput> {
    logger.debug(
      { userId: ctx.userId, messageId: input.messageId },
      "readMessage"
    );

    const folder = resolveFolder(input.folder);
    const uid = parseInt(input.messageId, 10);

    if (isNaN(uid)) {
      throw imapError("Invalid message ID — must be a numeric UID");
    }

    const message = await withImap(
      ctx.userId,
      ctx.credentials,
      async (client) => fetchMessageByUid(client, folder, uid)
    );

    // Sanitize HTML if requested (default: true)
    if (input.sanitizeHtml && message.htmlBody) {
      message.htmlBody = sanitizeEmailHtml(message.htmlBody);
    }

    // Truncate bodies
    if (message.textBody) {
      message.textBody = truncateBody(message.textBody);
    }
    if (message.htmlBody) {
      message.htmlBody = truncateBody(message.htmlBody, 200_000);
    }

    // Generate snippet from text body
    if (!message.snippet && message.textBody) {
      message.snippet = makeSnippet(message.textBody);
    }

    return message;
  }

  async sendMessage(
    input: SendMessageInput,
    ctx: UserContext
  ): Promise<SendMessageOutput> {
    logger.debug(
      { userId: ctx.userId, to: input.to.map((a) => a.email) },
      "sendMessage"
    );

    const transport = buildSmtpTransport(ctx.credentials);
    return sendViaSMTP(transport, input, ctx.credentials.email);
  }

  async markRead(
    input: MessageActionInput,
    ctx: UserContext
  ): Promise<ActionResult> {
    logger.debug(
      { userId: ctx.userId, messageId: input.messageId },
      "markRead"
    );

    const folder = resolveFolder(input.folder);
    const uid = parseInt(input.messageId, 10);

    await withImap(ctx.userId, ctx.credentials, async (client) => {
      await setSeenFlag(client, folder, uid);
    });

    return { success: true, messageId: input.messageId };
  }

  async markUnread(
    input: MessageActionInput,
    ctx: UserContext
  ): Promise<ActionResult> {
    logger.debug(
      { userId: ctx.userId, messageId: input.messageId },
      "markUnread"
    );

    const folder = resolveFolder(input.folder);
    const uid = parseInt(input.messageId, 10);

    await withImap(ctx.userId, ctx.credentials, async (client) => {
      await clearSeenFlag(client, folder, uid);
    });

    return { success: true, messageId: input.messageId };
  }

  async archiveMessage(
    input: MessageActionInput,
    ctx: UserContext
  ): Promise<ActionResult> {
    logger.debug(
      { userId: ctx.userId, messageId: input.messageId },
      "archiveMessage"
    );

    const folder = resolveFolder(input.folder);
    const uid = parseInt(input.messageId, 10);

    await withImap(ctx.userId, ctx.credentials, async (client) => {
      await archiveMsg(client, folder, uid);
    });

    return { success: true, messageId: input.messageId };
  }
}
