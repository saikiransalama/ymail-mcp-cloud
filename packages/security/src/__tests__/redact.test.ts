import { describe, it, expect } from "vitest";
import { redactSecrets } from "../redact.js";

describe("redactSecrets", () => {
  it("redacts sensitive fields at top level", () => {
    const obj = {
      email: "test@example.com",
      password: "supersecret",
      name: "Alice",
    };
    const result = redactSecrets(obj);
    expect(result.email).toBe("test@example.com");
    expect(result.password).toBe("[REDACTED]");
    expect(result.name).toBe("Alice");
  });

  it("redacts appPassword field", () => {
    const obj = { yahooEmail: "user@yahoo.com", appPassword: "xxxx-xxxx" };
    const result = redactSecrets(obj);
    expect(result.yahooEmail).toBe("user@yahoo.com");
    expect(result.appPassword).toBe("[REDACTED]");
  });

  it("redacts nested sensitive fields", () => {
    const obj = {
      user: {
        email: "user@example.com",
        passwordHash: "$argon2id$...",
      },
    };
    const result = redactSecrets(obj);
    expect((result.user as Record<string, unknown>).email).toBe("user@example.com");
    expect((result.user as Record<string, unknown>).passwordHash).toBe("[REDACTED]");
  });

  it("handles arrays", () => {
    const arr = [{ password: "secret" }, { name: "Alice" }];
    const result = redactSecrets(arr);
    expect(result[0].password).toBe("[REDACTED]");
    expect(result[1].name).toBe("Alice");
  });

  it("passes through null and undefined", () => {
    expect(redactSecrets(null)).toBeNull();
    expect(redactSecrets(undefined)).toBeUndefined();
  });

  it("passes through primitives unchanged", () => {
    expect(redactSecrets("hello")).toBe("hello");
    expect(redactSecrets(42)).toBe(42);
  });

  it("redacts encrypted_secret_blob, iv, auth_tag", () => {
    const obj = {
      id: "abc123",
      encrypted_secret_blob: "deadbeef",
      iv: "aabbcc",
      auth_tag: "112233",
    };
    const result = redactSecrets(obj);
    expect(result.id).toBe("abc123");
    expect(result.encrypted_secret_blob).toBe("[REDACTED]");
    expect(result.iv).toBe("[REDACTED]");
    expect(result.auth_tag).toBe("[REDACTED]");
  });
});
