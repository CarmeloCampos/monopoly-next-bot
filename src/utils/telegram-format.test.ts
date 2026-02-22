import { describe, it, expect } from "bun:test";
import { formatTelegramText } from "./telegram-format";

describe("formatTelegramText", () => {
  it("should replace placeholders with escaped values", () => {
    const result = formatTelegramText("Hello {name}!", { name: "John" });
    expect(result).toBe("Hello John!");
  });

  it("should escape special characters in replacement values", () => {
    const result = formatTelegramText("Hello {name}!", {
      name: "John*Doe_test",
    });
    expect(result).toBe("Hello John\\*Doe\\_test!");
  });

  it("should handle multiple placeholders", () => {
    const result = formatTelegramText("{greeting} {name}", {
      greeting: "Hello",
      name: "User*Name",
    });
    expect(result).toBe("Hello User\\*Name");
  });

  it("should not modify template markdown when value has no special chars", () => {
    const result = formatTelegramText("*bold* {name}", { name: "John" });
    expect(result).toBe("*bold* John");
  });

  it("should handle empty replacements", () => {
    const result = formatTelegramText("Hello {name}!", { name: "" });
    expect(result).toBe("Hello !");
  });

  it("should handle missing placeholders gracefully", () => {
    const result = formatTelegramText("Hello {name}!", { other: "value" });
    expect(result).toBe("Hello {name}!");
  });
});
