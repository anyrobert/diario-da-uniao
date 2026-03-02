import { assertEquals } from "@std/assert";
import { removeDuplicatedText } from "../src/scripts/dedupe-notes.ts";

function buildLongParagraph(prefix: string): string {
  return `${prefix} ${"conteudo ".repeat(80).trim()}`;
}

Deno.test("removeDuplicatedText", async (t) => {
  await t.step("removes duplicated suffix block", () => {
    const paragraphA = buildLongParagraph("A");
    const paragraphB = buildLongParagraph("B");
    const base = [
      "# Destaques do Diário Oficial da União - 01/01/2026",
      "",
      "01/01/2026",
      "",
      paragraphA,
      "",
      paragraphB,
    ].join("\n");

    const duplicateStart = base.indexOf("\n01/01/2026\n") + 1;
    const duplicated = `${base}${base.slice(duplicateStart)}`;

    const result = removeDuplicatedText(duplicated);

    assertEquals(result.cleaned, base);
    assertEquals(result.duplicatedChunksRemoved, 1);
  });

  await t.step("keeps content untouched when there is no duplicated text", () => {
    const content = "linha 1\r\nlinha 2\r\n";
    const result = removeDuplicatedText(content);

    assertEquals(result.cleaned, content);
    assertEquals(result.duplicatedChunksRemoved, 0);
    assertEquals(result.duplicatedCharsRemoved, 0);
  });

  await t.step("preserves CRLF line endings after cleanup", () => {
    const paragraphA = buildLongParagraph("A");
    const paragraphB = buildLongParagraph("B");
    const base = `# Titulo\r\n\r\n02/01/2026\r\n\r\n${paragraphA}\r\n\r\n${paragraphB}`;
    const duplicated = `${base}\r\n02/01/2026\r\n\r\n${paragraphA}\r\n\r\n${paragraphB}`;

    const result = removeDuplicatedText(duplicated);

    assertEquals(result.cleaned, base);
  });
});
