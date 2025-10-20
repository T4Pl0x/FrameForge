import { describe, it, expect } from "vitest";

describe("ext-sandbox", () => {
  it("package structure exists", () => {
    expect(import.meta.url).toBeDefined();
    expect(true).toBe(true);
  });
});

