export const QUEUE_NAMES = {
  CONNECTION_HEALTH: "connection-health-check",
  MAILBOX_SYNC: "mailbox-sync",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export interface ConnectionHealthJobData {
  connectionId: string;
  userId: string;
}

export interface MailboxSyncJobData {
  connectionId: string;
  userId: string;
  folder?: string;
}
