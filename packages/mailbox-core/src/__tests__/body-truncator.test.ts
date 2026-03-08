import { describe, it, expect } from "vitest";
import { truncateBody } from "../body-truncator.js";

describe("truncateBody", () => {
  it("returns text unchanged if within limit", () => {
    const text = "Short text";
    expect(truncateBody(text, 100)).toBe(text);
  });

  it("truncates text that exceeds limit", () => {
    const text = "a".repeat(1000);
    const result = truncateBody(text, 100);
    expect(result.length).toBeLessThan(1000);
    expect(result).toContain("[...message truncated");
  });

  it("breaks at paragraph boundary when possible", () => {
    const text = "First paragraph.\n\nSecond paragraph.\n\nThird paragraph that is very long and goes on and on.";
    const result = truncateBody(text, 40);
    expect(result).toContain("[...message truncated");
    expect(result.length).toBeLessThanOrEqual(200); // After truncation
  });

  it("truncates at max if no good break point", () => {
    const text = "a".repeat(200);
    const result = truncateBody(text, 100);
    expect(result).toContain("[...message truncated");
  });

  it("handles empty string", () => {
    expect(truncateBody("")).toBe("");
  });

  it("uses default max of 50000", () => {
    const text = "a".repeat(49999);
    expect(truncateBody(text)).toBe(text); // Under limit

    const longText = "a".repeat(51000);
    const result = truncateBody(longText);
    expect(result).toContain("[...message truncated");
  });
});
