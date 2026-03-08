import { describe, it, expect } from "vitest";
import { signToken, verifyToken, extractBearerToken } from "../jwt.js";

const SECRET = "a".repeat(64); // 64-char test secret

describe("signToken / verifyToken", () => {
  it("signs and verifies a valid token", () => {
    const token = signToken({ sub: "user-123", email: "test@example.com" }, SECRET);
    const payload = verifyToken(token, SECRET);

    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe("user-123");
    expect(payload?.email).toBe("test@example.com");
  });

  it("returns null for invalid token", () => {
    const result = verifyToken("not.a.valid.token", SECRET);
    expect(result).toBeNull();
  });

  it("returns null for tampered token", () => {
    const token = signToken({ sub: "user-123", email: "test@example.com" }, SECRET);
    const tampered = token.slice(0, -5) + "xxxxx";
    expect(verifyToken(tampered, SECRET)).toBeNull();
  });

  it("returns null for wrong secret", () => {
    const token = signToken({ sub: "user-123", email: "test@example.com" }, SECRET);
    const result = verifyToken(token, "b".repeat(64));
    expect(result).toBeNull();
  });

  it("throws if secret is too short", () => {
    expect(() => signToken({ sub: "x", email: "x@y.com" }, "short")).toThrow();
  });
});

describe("extractBearerToken", () => {
  it("extracts token from valid Authorization header", () => {
    expect(extractBearerToken("Bearer mytoken123")).toBe("mytoken123");
    expect(extractBearerToken("bearer mytoken123")).toBe("mytoken123");
  });

  it("returns null for missing header", () => {
    expect(extractBearerToken(undefined)).toBeNull();
    expect(extractBearerToken("")).toBeNull();
  });

  it("returns null for non-bearer scheme", () => {
    expect(extractBearerToken("Basic dXNlcjpwYXNz")).toBeNull();
    expect(extractBearerToken("Token abc123")).toBeNull();
  });

  it("returns null for malformed header", () => {
    expect(extractBearerToken("Bearer")).toBeNull();
    expect(extractBearerToken("Bearer  ")).toBeNull();
  });
});
