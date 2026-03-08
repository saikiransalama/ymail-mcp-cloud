import type { FolderInfo } from "@ymail-mcp/shared-types";

/**
 * Maps imapflow ListResponse entries to normalized FolderInfo objects.
 * Yahoo uses non-standard folder names for special folders.
 */
export function mapImapFolder(raw: {
  path: string;
  name?: string;
  delimiter?: string;
  flags?: Set<string> | string[];
  specialUse?: string;
  status?: { messages?: number; unseen?: number };
}): FolderInfo {
  const flags = raw.flags
    ? Array.isArray(raw.flags)
      ? raw.flags
      : [...raw.flags]
    : [];

  return {
    name: raw.name ?? raw.path,
    path: raw.path,
    delimiter: raw.delimiter,
    flags,
    specialUse: raw.specialUse,
    exists: raw.status?.messages,
    unseen: raw.status?.unseen,
  };
}

/**
 * Normalize a user-provided folder name to the actual IMAP path.
 * Yahoo may use "Bulk Mail" for spam, etc.
 */
export function resolveFolder(folderName: string): string {
  const normalized = folderName.trim();
  const aliases: Record<string, string> = {
    spam: "Bulk Mail",
    junk: "Bulk Mail",
    "bulk mail": "Bulk Mail",
    archive: "Archive",
    drafts: "Draft",
    draft: "Draft",
    sent: "Sent",
    trash: "Trash",
    deleted: "Trash",
    inbox: "INBOX",
  };

  return aliases[normalized.toLowerCase()] ?? normalized;
}

/**
 * The canonical Yahoo archive folder path.
 * Used by archiveMessage to move messages.
 */
export const YAHOO_ARCHIVE_FOLDER = "Archive";
