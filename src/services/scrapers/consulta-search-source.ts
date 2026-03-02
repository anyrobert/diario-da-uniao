import { DOMParser } from "@b-fuze/deno-dom";
import { Highlight } from "../../types/index.ts";
import { CONSULTA_SCRIPT_ID, CONSULTA_SEARCH_URL } from "./constants.ts";
import {
  formatToBrazilianDate,
  formatToConsultaDate,
  normalizeWhitespace,
  stripHtml,
  toAbsoluteInUrl,
  toErrorMessage,
} from "./helpers.ts";
import { ConsultaSearchSourceOptions, DOUHighlightSource, Fetcher } from "./types.ts";

interface ConsultaHighlightRaw {
  title?: string;
  content?: string;
  pubDate?: string;
  urlTitle?: string;
}

export class ConsultaSearchSource implements DOUHighlightSource {
  readonly name = "consulta";
  readonly purpose = "live" as const;

  private readonly baseUrl: string;
  private readonly fetchFn: Fetcher;
  private readonly query: string;
  private readonly resultLimit: number;
  private readonly sections: string[];

  constructor(options: ConsultaSearchSourceOptions = {}) {
    this.baseUrl = options.baseUrl ?? CONSULTA_SEARCH_URL;
    this.fetchFn = options.fetchFn ?? fetch;
    this.query = options.query ?? "* ";
    this.resultLimit = options.resultLimit ?? 20;
    this.sections = options.sections ?? ["do1"];
  }

  private buildSearchUrl(targetDate: string): string {
    const params = new URLSearchParams({
      q: this.query,
      exactDate: "personalizado",
      publishFrom: formatToConsultaDate(targetDate),
      publishTo: formatToConsultaDate(targetDate),
      sortType: "0",
      delta: String(this.resultLimit),
    });

    for (const section of this.sections) {
      params.append("s", section);
    }

    return `${this.baseUrl}?${params.toString()}`;
  }

  private extractScriptContent(html: string): string | null {
    const regex =
      /<script[^>]*id="_br_com_seatecnologia_in_buscadou_BuscaDouPortlet_params"[^>]*>([\s\S]*?)<\/script>/i;
    const directMatch = html.match(regex)?.[1]?.trim();
    if (directMatch) {
      return directMatch;
    }

    const doc = new DOMParser().parseFromString(html, "text/html");
    const scriptContent = doc?.querySelector(`script#${CONSULTA_SCRIPT_ID}`)?.textContent ?? "";
    return scriptContent.trim() || null;
  }

  private parseConsultaResults(html: string): ConsultaHighlightRaw[] {
    const rawScript = this.extractScriptContent(html);
    if (!rawScript) {
      return [];
    }

    try {
      const parsed = JSON.parse(rawScript) as { jsonArray?: ConsultaHighlightRaw[] };
      return Array.isArray(parsed.jsonArray) ? parsed.jsonArray : [];
    } catch {
      return [];
    }
  }

  private toHighlight(result: ConsultaHighlightRaw): Highlight | null {
    const section = normalizeWhitespace(result.title ?? "");
    const text = normalizeWhitespace(stripHtml(result.content ?? ""));
    const date = normalizeWhitespace(result.pubDate ?? "");
    const rawUrl = normalizeWhitespace(result.urlTitle ?? "");

    if (!section || !text || !date || !rawUrl) {
      return null;
    }

    return {
      text,
      url: toAbsoluteInUrl(rawUrl),
      date,
      section,
    };
  }

  async getHighlights(targetDate: string): Promise<Highlight[]> {
    try {
      const response = await this.fetchFn(this.buildSearchUrl(targetDate));
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const expectedDate = formatToBrazilianDate(targetDate);
      const parsed = this.parseConsultaResults(html);
      const highlights = parsed
        .map((item) => this.toHighlight(item))
        .filter((item): item is Highlight => Boolean(item))
        .filter((item) => item.date === expectedDate);

      const deduped = new Map<string, Highlight>();
      for (const item of highlights) {
        if (!deduped.has(item.url)) {
          deduped.set(item.url, item);
        }
      }

      return [...deduped.values()];
    } catch (error: unknown) {
      throw new Error(`Failed to fetch highlights from consulta search: ${toErrorMessage(error)}`);
    }
  }
}
