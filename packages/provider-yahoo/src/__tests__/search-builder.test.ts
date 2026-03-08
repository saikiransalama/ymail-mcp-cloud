import { describe, it, expect } from "vitest";
import { buildImapSearchCriteria } from "../search-builder.js";

describe("buildImapSearchCriteria", () => {
  it("returns all:true when no criteria provided (edge case)", () => {
    const result = buildImapSearchCriteria({});
    expect(result).toEqual({ all: true });
  });

  it("builds from query text", () => {
    const result = buildImapSearchCriteria({ query: "invoice" });
    expect(JSON.stringify(result)).toContain("invoice");
  });

  it("builds from sender", () => {
    const result = buildImapSearchCriteria({ from: "alice@example.com" });
    expect(result).toEqual({ from: "alice@example.com" });
  });

  it("builds from subject", () => {
    const result = buildImapSearchCriteria({ subject: "Q3 Report" });
    expect(result).toEqual({ subject: "Q3 Report" });
  });

  it("builds from unreadOnly", () => {
    const result = buildImapSearchCriteria({ unreadOnly: true });
    expect(result).toEqual({ seen: false });
  });

  it("builds from since date", () => {
    const since = "2026-01-01T00:00:00Z";
    const result = buildImapSearchCriteria({ since });
    expect(JSON.stringify(result)).toContain("since");
  });

  it("combines multiple criteria with AND", () => {
    const result = buildImapSearchCriteria({
      from: "alice@example.com",
      unreadOnly: true,
    });
    // Should be combined (nested and structure or flat object with both keys)
    const serialized = JSON.stringify(result);
    expect(serialized).toContain("alice@example.com");
    expect(serialized).toContain("seen");
  });
});
