import { describe, expect, test } from "vitest";
import { areFormValuesEqual } from "./changes";

describe("areFormValuesEqual", () => {
  test("recognizes equivalent form values", () => {
    expect(areFormValuesEqual(
      { name: "Nina", tags: ["Dócil", "Ativo"] },
      { name: "Nina", tags: ["Dócil", "Ativo"] },
    )).toBe(true);
  });

  test("detects field and ordered-list changes", () => {
    expect(areFormValuesEqual({ name: "Nina" }, { name: "Amora" })).toBe(false);
    expect(areFormValuesEqual(["first", "second"], ["second", "first"])).toBe(false);
  });
});
