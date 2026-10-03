import { describe, expect, test } from "vitest";

import { getFirstDisplayName } from "@/features/dashboard/lib/get-first-display-name";

describe("getFirstDisplayName", () => {
  test("returns the first name from a full name", () => {
    expect(getFirstDisplayName("Ana Lima")).toBe("Ana");
  });

  test("trims surrounding whitespace before taking the first name", () => {
    expect(getFirstDisplayName("  Bruno Costa  ")).toBe("Bruno");
  });

  test("returns null when the name is missing or blank", () => {
    expect(getFirstDisplayName(null)).toBeNull();
    expect(getFirstDisplayName("   ")).toBeNull();
  });
});
