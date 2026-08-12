export interface Mail {
  to: string;
  subject: string;
  text: string;
  attachments?: { filename: string; content: Uint8Array }[];
}

export interface MailSender {
  // The mail API delivers a message only once per idempotency key within 24 hours.
  send(mail: Mail, options?: { idempotencyKey?: string }): Promise<void>;
}

export function httpMailSender({ url, token, timeoutMs = 10_000 }: { url: string; token: string; timeoutMs?: number }) {
  return {
    async send(mail, { idempotencyKey } = {}) {
      const response = await fetch(new URL("/v1/messages", url), {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
        },
        body: JSON.stringify({
          from: "Kontor Rechnungen <rechnungen@kontor.example>",
          ...mail,
          attachments: mail.attachments?.map(({ filename, content }) => ({
            filename,
            content: Buffer.from(content).toString("base64"),
          })),
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!response.ok) throw new Error(`mail API answered ${response.status}: ${await response.text()}`);
    },
  } satisfies MailSender;
}
