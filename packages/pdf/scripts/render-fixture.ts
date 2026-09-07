import { writeFile } from "node:fs/promises";
import { renderInvoicePdf } from "../src/index.ts";
import { invoice } from "../test/fixtures.ts";

const out = process.argv[2] ?? "invoice.pdf";
await writeFile(out, await renderInvoicePdf(invoice));
console.log(`wrote ${out}`);
