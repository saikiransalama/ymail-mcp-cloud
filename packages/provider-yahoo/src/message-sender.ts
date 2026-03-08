import type { Transporter } from "nodemailer";
import type { SendMessageInput, SendMessageOutput } from "@ymail-mcp/shared-types";
import { mapSmtpError } from "./error-mapper.js";

/**
 * Send a message via Yahoo SMTP using nodemailer.
 */
export async function sendViaSMTP(
  transport: Transporter,
  input: SendMessageInput,
  fromEmail: string
): Promise<SendMessageOutput> {
  const toAddresses = input.to.map((a) =>
    a.name ? `"${a.name}" <${a.email}>` : a.email
  );
  const ccAddresses = (input.cc ?? []).map((a) =>
    a.name ? `"${a.name}" <${a.email}>` : a.email
  );
  const bccAddresses = (input.bcc ?? []).map((a) =>
    a.name ? `"${a.name}" <${a.email}>` : a.email
  );

  const mailOptions: Parameters<Transporter["sendMail"]>[0] = {
    from: fromEmail,
    to: toAddresses.join(", "),
    subject: input.subject,
    text: input.textBody,
    ...(ccAddresses.length > 0 ? { cc: ccAddresses.join(", ") } : {}),
    ...(bccAddresses.length > 0 ? { bcc: bccAddresses.join(", ") } : {}),
    ...(input.htmlBody ? { html: input.htmlBody } : {}),
    ...(input.replyToMessageId
      ? { inReplyTo: input.replyToMessageId, references: input.replyToMessageId }
      : {}),
  };

  try {
    const info = await transport.sendMail(mailOptions);
    return {
      messageId: info.messageId,
      accepted: info.accepted?.map(String) ?? toAddresses,
      rejected: info.rejected?.map(String) ?? [],
      sentAt: new Date().toISOString(),
    };
  } catch (err) {
    throw mapSmtpError(err);
  }
}
