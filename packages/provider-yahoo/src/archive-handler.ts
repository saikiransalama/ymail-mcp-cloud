import type { ImapFlow } from "imapflow";
import { imapError } from "@ymail-mcp/mailbox-core";
import { YAHOO_ARCHIVE_FOLDER } from "./folder-mapper.js";

/**
 * Archive a message by moving it to the Yahoo Archive folder.
 *
 * Yahoo's archive folder is named "Archive" (not "[Gmail]/All Mail").
 * The folder is created automatically on first use if it doesn't exist.
 */
export async function archiveMessage(
  client: ImapFlow,
  sourceFolder: string,
  uid: number
): Promise<void> {
  const lock = await client.getMailboxLock(sourceFolder);
  try {
    // Move message to Archive folder
    const result = await client.messageMove(String(uid), YAHOO_ARCHIVE_FOLDER, {
      uid: true,
    });

    if (!result) {
      throw new Error(`Failed to move message ${uid} to archive`);
    }
  } catch (err) {
    throw imapError(
      `Failed to archive message ${uid} from ${sourceFolder}`,
      err
    );
  } finally {
    lock.release();
  }
}
