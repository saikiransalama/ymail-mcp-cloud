export const IMAP_HOST = "imap.mail.yahoo.com";
export const IMAP_PORT = 993;
export const IMAP_SECURE = true;

export const SMTP_HOST = "smtp.mail.yahoo.com";
export const SMTP_PORT = 465;
export const SMTP_SECURE = true;

export const POOL_MAX = 50;
export const POOL_IDLE_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
export const IMAP_TIMEOUT_MS = 30_000; // 30 seconds
export const SMTP_TIMEOUT_MS = 30_000;
export const IMAP_GREETING_TIMEOUT_MS = 15_000;

// Yahoo-specific folder names (discovered via LIST, these are common defaults)
export const YAHOO_FOLDERS = {
  INBOX: "INBOX",
  SENT: "Sent",
  DRAFT: "Draft",
  TRASH: "Trash",
  SPAM: "Bulk Mail",
  ARCHIVE: "Archive",
} as const;

export type YahooFolderName = (typeof YAHOO_FOLDERS)[keyof typeof YAHOO_FOLDERS];
