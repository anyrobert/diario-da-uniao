import { DOMParser, Element } from "@b-fuze/deno-dom";
import { Highlight } from "../../types/index.ts";
import { HIGHLIGHTS_PAGE_URL } from "./constants.ts";
import {
  formatToBrazilianDate,
  normalizeWhitespace,
  toAbsoluteInUrl,
  toErrorMessage,
} from "./helpers.ts";
import { DOUHighlightSource, Fetcher, HighlightsPageSourceOptions } from "./types.ts";

export class HighlightsPageSource implements DOUHighlightSource {
  readonly name = "highlights";
  readonly purpose = "live" as const;

  private readonly baseUrl: string;
  private readonly fetchFn: Fetcher;

  constructor(options: HighlightsPageSourceOptions = {}) {
    this.baseUrl = options.baseUrl ?? HIGHLIGHTS_PAGE_URL;
    this.fetchFn = options.fetchFn ?? fetch;
  }

  private parseHighlight(article: Element): Highlight | null {
    const titleNode = article.querySelector(".title");
    const title = normalizeWhitespace(titleNode?.textContent ?? "");
    const description = normalizeWhitespace(article.querySelector(".summary")?.textContent ?? "");
    const date = normalizeWhitespace(article.querySelector(".date")?.textContent ?? "");
    const rawUrl = titleNode?.getAttribute("href") ??
      titleNode?.querySelector("a")?.getAttribute("href") ??
      article.querySelector("a.title")?.getAttribute("href") ??
      article.querySelector("a")?.getAttribute("href") ??
      "";

    if (!title || !description || !date || !rawUrl) {
      return null;
    }

    return {
      text: description,
      url: toAbsoluteInUrl(rawUrl),
      date,
      section: title,
    };
  }

  async getHighlights(targetDate: string): Promise<Highlight[]> {
    try {
      const response = await this.fetchFn(this.baseUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      if (!doc) {
        throw new Error("Failed to parse HTML document");
      }

      const articles = doc.querySelector(".lista-de-dou");
      if (!articles) {
        return [];
      }

      const expectedDate = formatToBrazilianDate(targetDate);
      const highlights: Highlight[] = [];

      for (const child of Array.from(articles.children)) {
        const highlight = this.parseHighlight(child as Element);
        if (highlight && highlight.date === expectedDate) {
          highlights.push(highlight);
        }
      }

      return highlights;
    } catch (error: unknown) {
      throw new Error(`Failed to fetch highlights from highlights page: ${toErrorMessage(error)}`);
    }
  }
}
