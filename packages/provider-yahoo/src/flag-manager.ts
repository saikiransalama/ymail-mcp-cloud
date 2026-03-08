import type { ImapFlow } from "imapflow";
import { imapError } from "@ymail-mcp/mailbox-core";

/**
 * Set the \Seen flag on a message (mark as read).
 */
export async function setSeenFlag(
  client: ImapFlow,
  folder: string,
  uid: number
): Promise<void> {
  const lock = await client.getMailboxLock(folder);
  try {
    await client.messageFlagsAdd(String(uid), ["\\Seen"], { uid: true });
  } catch (err) {
    throw imapError(`Failed to mark message ${uid} as read`, err);
  } finally {
    lock.release();
  }
}

/**
 * Remove the \Seen flag from a message (mark as unread).
 */
export async function clearSeenFlag(
  client: ImapFlow,
  folder: string,
  uid: number
): Promise<void> {
  const lock = await client.getMailboxLock(folder);
  try {
    await client.messageFlagsRemove(String(uid), ["\\Seen"], { uid: true });
  } catch (err) {
    throw imapError(`Failed to mark message ${uid} as unread`, err);
  } finally {
    lock.release();
  }
}
