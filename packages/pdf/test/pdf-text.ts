import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

// The text of the first page, one string per line, top to bottom.
export async function pdfText(pdf: Uint8Array): Promise<string[]> {
  const loading = getDocument({ data: pdf.slice() });
  const document = await loading.promise;
  const page = await document.getPage(1);
  const lines = new Map<number, { x: number; text: string }[]>();
  for (const item of (await page.getTextContent()).items) {
    if (!("str" in item) || item.str.trim() === "") continue;
    const y = Math.round(item.transform[5]);
    lines.set(y, [...(lines.get(y) ?? []), { x: item.transform[4], text: item.str }]);
  }
  await loading.destroy();
  return [...lines.entries()]
    .sort(([a], [b]) => b - a)
    .map(([, items]) =>
      items
        .sort((a, b) => a.x - b.x)
        .map((item) => item.text)
        .join(" "),
    );
}
