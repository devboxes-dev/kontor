import { beforeEach, expect, it, vi } from "vitest";
import { runWithRetries } from "../src/retry.ts";

beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

it("runs a failed job again until it succeeds", async () => {
  const job = vi.fn().mockRejectedValueOnce(new Error("mail API answered 503")).mockResolvedValueOnce({ sent: 2 });

  await runWithRetries("test", job, { delayMs: 0 });

  expect(job).toHaveBeenCalledTimes(2);
});

it("gives up after the last attempt", async () => {
  const job = vi.fn().mockRejectedValue(new Error("mail API answered 503"));

  await runWithRetries("test", job, { attempts: 3, delayMs: 0 });

  expect(job).toHaveBeenCalledTimes(3);
  expect(console.error).toHaveBeenCalledWith("test: failed after 3 attempts", expect.any(Error));
});
