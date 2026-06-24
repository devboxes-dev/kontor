import { setTimeout } from "node:timers/promises";

export async function runWithRetries(
  name: string,
  job: () => Promise<unknown>,
  { attempts = 3, delayMs = 15 * 60_000 } = {},
): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      console.log(`${name}: done`, await job());
      return;
    } catch (error) {
      if (attempt >= attempts) {
        console.error(`${name}: failed after ${attempt} attempts`, error);
        return;
      }
      console.warn(`${name}: attempt ${attempt} failed, retrying in ${delayMs / 60_000} minutes`, error);
      await setTimeout(delayMs);
    }
  }
}
