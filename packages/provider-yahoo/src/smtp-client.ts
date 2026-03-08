import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import type { ProviderCredentials } from "@ymail-mcp/mailbox-core";
import {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURE,
  SMTP_TIMEOUT_MS,
} from "./constants.js";

/**
 * Build a nodemailer Transporter for Yahoo SMTP.
 * Uses port 465 with SSL (secure:true).
 *
 * Note: We do not pool SMTP transports — they are stateless and cheap to create.
 */
export function buildSmtpTransport(
  credentials: ProviderCredentials
): Transporter {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: {
      user: credentials.email,
      pass: credentials.appPassword,
    },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
    tls: {
      rejectUnauthorized: true,
    },
  });
}
