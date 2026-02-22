import { describe, it, expect, vi, beforeEach, afterEach } from "bun:test";
import type { Telegram } from "telegraf";
import { sendMarkdownSafe } from "./telegram-send";

describe("sendMarkdownSafe", () => {
  let mockTelegram: Telegram & {
    sendMessage: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockTelegram = {
      sendMessage: vi.fn(),
    } as unknown as Telegram & {
      sendMessage: ReturnType<typeof vi.fn>;
    };
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should send message with Markdown parse mode on success", async () => {
    mockTelegram.sendMessage.mockResolvedValue(undefined);

    await sendMarkdownSafe(mockTelegram, 12345, "Hello *world*!");

    expect(mockTelegram.sendMessage).toHaveBeenCalledWith(
      12345,
      "Hello *world*!",
      { parse_mode: "Markdown" },
    );
  });

  it("should retry without parse_mode on parse error", async () => {
    mockTelegram.sendMessage
      .mockRejectedValueOnce(new Error("can't parse entities"))
      .mockResolvedValueOnce(undefined);

    await sendMarkdownSafe(mockTelegram, 12345, "Hello *world*!");

    expect(mockTelegram.sendMessage).toHaveBeenCalledTimes(2);
    expect(mockTelegram.sendMessage).toHaveBeenNthCalledWith(
      1,
      12345,
      "Hello *world*!",
      { parse_mode: "Markdown" },
    );
    expect(mockTelegram.sendMessage).toHaveBeenNthCalledWith(
      2,
      12345,
      "Hello *world*!",
      undefined,
    );
  });

  it("should retry on CantParseEntities error variant", async () => {
    mockTelegram.sendMessage
      .mockRejectedValueOnce(new Error("CantParseEntities"))
      .mockResolvedValueOnce(undefined);

    await sendMarkdownSafe(mockTelegram, 12345, "Test message");

    expect(mockTelegram.sendMessage).toHaveBeenCalledTimes(2);
  });

  it("should retry on parse entities error (lowercase)", async () => {
    mockTelegram.sendMessage
      .mockRejectedValueOnce(new Error("error: parse entities"))
      .mockResolvedValueOnce(undefined);

    await sendMarkdownSafe(mockTelegram, 12345, "Test message");

    expect(mockTelegram.sendMessage).toHaveBeenCalledTimes(2);
  });

  it("should retry on bad request with entity", async () => {
    mockTelegram.sendMessage
      .mockRejectedValueOnce(new Error("Bad Request: cant parse entity"))
      .mockResolvedValueOnce(undefined);

    await sendMarkdownSafe(mockTelegram, 12345, "Test message");

    expect(mockTelegram.sendMessage).toHaveBeenCalledTimes(2);
  });

  it("should throw on non-parse errors", async () => {
    mockTelegram.sendMessage.mockRejectedValueOnce(new Error("Network error"));

    await expect(
      sendMarkdownSafe(mockTelegram, 12345, "Test message"),
    ).rejects.toThrow("Network error");

    expect(mockTelegram.sendMessage).toHaveBeenCalledTimes(1);
  });

  it("should pass extra options to sendMessage", async () => {
    mockTelegram.sendMessage.mockResolvedValue(undefined);

    await sendMarkdownSafe(mockTelegram, 12345, "Hello!", {
      reply_markup: { inline_keyboard: [] },
    });

    expect(mockTelegram.sendMessage).toHaveBeenCalledWith(12345, "Hello!", {
      reply_markup: { inline_keyboard: [] },
      parse_mode: "Markdown",
    });
  });
});
