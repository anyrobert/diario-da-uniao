import { assertEquals, assertRejects } from "@std/assert";
import { DOUScraperService } from "../src/services/scraper.ts";

const mockHtml = `
<!DOCTYPE html>
<html>
  <body>
    <div class="lista-de-dou">
      <article>
        <h3 class="title" href="https://example.com/1">Test Title 1</h3>
        <p class="summary">Test Description 1</p>
        <span class="date">28/12/2024</span>
      </article>
      <article>
        <h3 class="title" href="https://example.com/2">Test Title 2</h3>
        <p class="summary">Test Description 2</p>
        <span class="date">28/12/2024</span>
      </article>
    </div>
  </body>
</html>
`;

Deno.test("DOUScraperService", async (t) => {
  await t.step("should fetch and parse highlights correctly", async () => {
    const scraper = new DOUScraperService();
    const mockFetch = async () => new Response(mockHtml);
    globalThis.fetch = mockFetch;

    const highlights = await scraper.getHighlights("2024-12-28");

    assertEquals(highlights.length, 2);
    assertEquals(highlights[0], {
      text: "Test Description 1",
      url: "https://example.com/1",
      date: "28/12/2024",
      section: "Test Title 1",
    });
  });

  await t.step("should return empty array when no highlights found", async () => {
    const scraper = new DOUScraperService();
    const mockFetch = async () => new Response("<html><body></body></html>");
    globalThis.fetch = mockFetch;

    const highlights = await scraper.getHighlights("2024-12-28");
    assertEquals(highlights.length, 0);
  });

  await t.step("should throw error on network failure", async () => {
    const scraper = new DOUScraperService();
    const mockFetch = async () => {
      throw new Error("Network error");
    };
    globalThis.fetch = mockFetch;

    await assertRejects(
      () => scraper.getHighlights("2024-12-28"),
      Error,
      "Failed to fetch highlights: Network error"
    );
  });

  await t.step("should throw error on HTTP error", async () => {
    const scraper = new DOUScraperService();
    const mockFetch = async () => new Response(null, { status: 404 });
    globalThis.fetch = mockFetch;

    await assertRejects(
      () => scraper.getHighlights("2024-12-28"),
      Error,
      "Failed to fetch highlights: HTTP error! status: 404"
    );
  });
}); 