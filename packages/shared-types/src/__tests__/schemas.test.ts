import { describe, it, expect } from "vitest";
import { ListMessagesInputSchema } from "../tools/list-messages.js";
import { SearchMessagesInputSchema } from "../tools/search-messages.js";
import { SendMessageInputSchema } from "../tools/send-message.js";
import { AppError, ErrorCode } from "../errors.js";

describe("ListMessagesInputSchema", () => {
  it("validates with defaults", () => {
    const result = ListMessagesInputSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.folder).toBe("INBOX");
      expect(result.data.limit).toBe(20);
    }
  });

  it("rejects limit > 100", () => {
    const result = ListMessagesInputSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });

  it("rejects limit < 1", () => {
    const result = ListMessagesInputSchema.safeParse({ limit: 0 });
    expect(result.success).toBe(false);
  });

  it("accepts cursor and unreadOnly", () => {
    const result = ListMessagesInputSchema.safeParse({
      folder: "Sent",
      limit: 50,
      cursor: "12345",
      unreadOnly: true,
    });
    expect(result.success).toBe(true);
  });
});

describe("SearchMessagesInputSchema", () => {
  it("rejects empty input (no criteria)", () => {
    const result = SearchMessagesInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts query-only input", () => {
    const result = SearchMessagesInputSchema.safeParse({ query: "invoice" });
    expect(result.success).toBe(true);
  });

  it("accepts from-only input", () => {
    const result = SearchMessagesInputSchema.safeParse({ from: "boss@example.com" });
    expect(result.success).toBe(true);
  });

  it("rejects limit > 50", () => {
    const result = SearchMessagesInputSchema.safeParse({
      query: "test",
      limit: 51,
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid datetime in since", () => {
    const result = SearchMessagesInputSchema.safeParse({
      query: "test",
      since: "not-a-date",
    });
    expect(result.success).toBe(false);
  });

  it("accepts valid since datetime", () => {
    const result = SearchMessagesInputSchema.safeParse({
      query: "test",
      since: "2024-01-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("SendMessageInputSchema", () => {
  it("accepts valid send input", () => {
    const result = SendMessageInputSchema.safeParse({
      to: [{ email: "recipient@example.com" }],
      subject: "Hello",
      textBody: "World",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty to array", () => {
    const result = SendMessageInputSchema.safeParse({
      to: [],
      subject: "Hello",
      textBody: "World",
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing subject", () => {
    const result = SendMessageInputSchema.safeParse({
      to: [{ email: "r@example.com" }],
      textBody: "World",
    });
    expect(result.success).toBe(false);
  });

  it("accepts optional cc, bcc, htmlBody", () => {
    const result = SendMessageInputSchema.safeParse({
      to: [{ email: "r@example.com" }],
      cc: [{ email: "cc@example.com" }],
      bcc: [{ email: "bcc@example.com", name: "BCC Person" }],
      subject: "Test",
      textBody: "Plain",
      htmlBody: "<p>HTML</p>",
      replyToMessageId: "42",
    });
    expect(result.success).toBe(true);
  });
});

describe("AppError", () => {
  it("constructs with code and message", () => {
    const err = new AppError("UNAUTHORIZED", "Not authenticated");
    expect(err.code).toBe("UNAUTHORIZED");
    expect(err.message).toBe("Not authenticated");
    expect(err instanceof Error).toBe(true);
  });

  it("toJSON includes error code", () => {
    const err = new AppError("VALIDATION_ERROR", "Bad input", { field: "email" });
    const json = err.toJSON();
    expect(json.error).toBe("VALIDATION_ERROR");
    expect(json.message).toBe("Bad input");
  });

  it("ErrorCode contains all 10 codes", () => {
    const codes = Object.values(ErrorCode);
    expect(codes).toContain("UNAUTHORIZED");
    expect(codes).toContain("FORBIDDEN");
    expect(codes).toContain("CONNECTION_NOT_FOUND");
    expect(codes).toContain("YAHOO_AUTH_FAILED");
    expect(codes).toContain("YAHOO_IMAP_ERROR");
    expect(codes).toContain("YAHOO_SMTP_ERROR");
    expect(codes).toContain("RATE_LIMITED");
    expect(codes).toContain("VALIDATION_ERROR");
    expect(codes).toContain("INTERNAL_ERROR");
    expect(codes).toContain("NOT_IMPLEMENTED");
  });
});
