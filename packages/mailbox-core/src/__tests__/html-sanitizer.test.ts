import { describe, it, expect } from "vitest";
import { sanitizeEmailHtml } from "../html-sanitizer.js";

describe("sanitizeEmailHtml", () => {
  it("allows safe formatting tags", () => {
    const html = "<p>Hello <strong>world</strong></p>";
    const result = sanitizeEmailHtml(html);
    expect(result).toContain("<strong>world</strong>");
    expect(result).toContain("<p>");
  });

  it("strips <script> tags", () => {
    const html = '<p>Hello</p><script>alert("xss")</script>';
    const result = sanitizeEmailHtml(html);
    expect(result).not.toContain("<script");
    expect(result).not.toContain("alert");
  });

  it("strips <iframe> tags", () => {
    const html = '<p>Content</p><iframe src="https://evil.com"></iframe>';
    const result = sanitizeEmailHtml(html);
    expect(result).not.toContain("<iframe");
    expect(result).not.toContain("evil.com");
  });

  it("strips event handlers", () => {
    const html = '<p onclick="alert(1)">Click me</p>';
    const result = sanitizeEmailHtml(html);
    expect(result).not.toContain("onclick");
    expect(result).not.toContain("alert");
    expect(result).toContain("Click me");
  });

  it("strips javascript: links", () => {
    const html = '<a href="javascript:alert(1)">Click</a>';
    const result = sanitizeEmailHtml(html);
    expect(result).not.toContain("javascript:");
  });

  it("allows safe anchor links", () => {
    const html = '<a href="https://example.com">Visit</a>';
    const result = sanitizeEmailHtml(html);
    expect(result).toContain("https://example.com");
  });

  it("allows mailto links", () => {
    const html = '<a href="mailto:test@example.com">Email me</a>';
    const result = sanitizeEmailHtml(html);
    expect(result).toContain("mailto:test@example.com");
  });

  it("strips style tags", () => {
    const html = "<style>body { color: red; }</style><p>Text</p>";
    const result = sanitizeEmailHtml(html);
    expect(result).not.toContain("<style");
    expect(result).toContain("Text");
  });

  it("handles empty string", () => {
    expect(sanitizeEmailHtml("")).toBe("");
  });

  it("handles plain text (no HTML)", () => {
    const text = "Just plain text with no tags";
    const result = sanitizeEmailHtml(text);
    expect(result).toContain("Just plain text");
  });
});
