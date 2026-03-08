import { describe, it, expect } from "vitest";
import { encryptSecret, decryptSecret } from "../encryption.js";
import { randomBytes } from "crypto";

function makeMasterKey(): string {
  return randomBytes(32).toString("hex");
}

describe("encryptSecret / decryptSecret", () => {
  it("encrypts and decrypts a string correctly", () => {
    const key = makeMasterKey();
    const plaintext = "hello world";
    const encrypted = encryptSecret(plaintext, key);

    expect(encrypted.blob).toBeTruthy();
    expect(encrypted.iv).toHaveLength(24); // 12 bytes = 24 hex chars
    expect(encrypted.authTag).toHaveLength(32); // 16 bytes = 32 hex chars

    const decrypted = decryptSecret(encrypted, key);
    expect(decrypted).toBe(plaintext);
  });

  it("encrypts JSON credentials correctly", () => {
    const key = makeMasterKey();
    const creds = { email: "test@yahoo.com", appPassword: "abcd-efgh-ijkl-mnop" };
    const plaintext = JSON.stringify(creds);

    const encrypted = encryptSecret(plaintext, key);
    const decrypted = decryptSecret(encrypted, key);

    expect(JSON.parse(decrypted)).toEqual(creds);
  });

  it("produces different ciphertexts for the same plaintext (unique IV)", () => {
    const key = makeMasterKey();
    const plaintext = "same input";
    const enc1 = encryptSecret(plaintext, key);
    const enc2 = encryptSecret(plaintext, key);

    expect(enc1.blob).not.toBe(enc2.blob);
    expect(enc1.iv).not.toBe(enc2.iv);
  });

  it("throws on wrong master key", () => {
    const key1 = makeMasterKey();
    const key2 = makeMasterKey();
    const encrypted = encryptSecret("secret data", key1);

    expect(() => decryptSecret(encrypted, key2)).toThrow();
  });

  it("throws on tampered ciphertext", () => {
    const key = makeMasterKey();
    const encrypted = encryptSecret("original", key);
    const tampered = {
      ...encrypted,
      blob: "deadbeef" + encrypted.blob.slice(8),
    };

    expect(() => decryptSecret(tampered, key)).toThrow();
  });

  it("throws if master key is wrong length", () => {
    expect(() => encryptSecret("text", "short")).toThrow();
    expect(() => decryptSecret({ blob: "a", iv: "b", authTag: "c" }, "short")).toThrow();
  });

  it("handles empty string", () => {
    const key = makeMasterKey();
    const encrypted = encryptSecret("", key);
    const decrypted = decryptSecret(encrypted, key);
    expect(decrypted).toBe("");
  });

  it("handles unicode content", () => {
    const key = makeMasterKey();
    const unicode = "Hello 日本語 🎉 مرحبا";
    const encrypted = encryptSecret(unicode, key);
    const decrypted = decryptSecret(encrypted, key);
    expect(decrypted).toBe(unicode);
  });
});
