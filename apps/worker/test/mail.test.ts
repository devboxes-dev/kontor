import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { expect, it } from "vitest";
import { httpMailSender } from "../src/mail.ts";

it("gives up when the mail API does not answer in time", async () => {
  const silent = createServer(() => {});
  await new Promise<void>((resolve) => silent.listen(0, "127.0.0.1", resolve));
  const { port } = silent.address() as AddressInfo;
  const mail = httpMailSender({ url: `http://127.0.0.1:${port}`, token: "test", timeoutMs: 50 });

  await expect(mail.send({ to: "test@kontor.example", subject: "Test", text: "Test" })).rejects.toThrow(/timeout/);

  silent.closeAllConnections();
  silent.close();
});
