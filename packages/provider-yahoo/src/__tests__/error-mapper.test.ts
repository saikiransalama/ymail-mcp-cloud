import { describe, it, expect } from "vitest";
import { mapImapError, mapSmtpError } from "../error-mapper.js";
import { AppError } from "@ymail-mcp/shared-types";

describe("mapImapError", () => {
  it("passes through AppError unchanged", () => {
    const err = new AppError("UNAUTHORIZED", "Not authorized");
    expect(mapImapError(err)).toBe(err);
  });

  it("maps authentication failure messages to YAHOO_AUTH_FAILED", () => {
    const err = new Error("Invalid credentials for user");
    const result = mapImapError(err);
    expect(result.code).toBe("YAHOO_AUTH_FAILED");
  });

  it("maps [AUTHENTICATIONFAILED] to YAHOO_AUTH_FAILED", () => {
    const err = new Error("[AUTHENTICATIONFAILED] Invalid login");
    const result = mapImapError(err);
    expect(result.code).toBe("YAHOO_AUTH_FAILED");
  });

  it("maps timeout errors to YAHOO_IMAP_ERROR", () => {
    const err = new Error("Connection timeout");
    const result = mapImapError(err);
    expect(result.code).toBe("YAHOO_IMAP_ERROR");
  });

  it("maps ETIMEDOUT to YAHOO_IMAP_ERROR", () => {
    const err = new Error("ETIMEDOUT");
    const result = mapImapError(err);
    expect(result.code).toBe("YAHOO_IMAP_ERROR");
  });

  it("maps generic IMAP errors to YAHOO_IMAP_ERROR", () => {
    const err = new Error("Some IMAP specific error");
    const result = mapImapError(err);
    expect(result.code).toBe("YAHOO_IMAP_ERROR");
  });

  it("handles non-Error objects", () => {
    const result = mapImapError("something went wrong");
    expect(result.code).toBe("YAHOO_IMAP_ERROR");
  });
});

describe("mapSmtpError", () => {
  it("maps authentication failure to YAHOO_AUTH_FAILED", () => {
    const err = new Error("Authentication failed for smtp");
    const result = mapSmtpError(err);
    expect(result.code).toBe("YAHOO_AUTH_FAILED");
  });

  it("maps generic SMTP errors to YAHOO_SMTP_ERROR", () => {
    const err = new Error("SMTP connection reset");
    const result = mapSmtpError(err);
    expect(result.code).toBe("YAHOO_SMTP_ERROR");
  });
});
