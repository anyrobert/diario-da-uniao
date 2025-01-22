import { DOMParser, Element } from "jsr:@b-fuze/deno-dom";
import { Highlight, ScraperService } from "../types/index.ts";

export class DOUScraperService implements ScraperService {
  private readonly baseUrl: string;

  constructor(baseUrl = "https://www.in.gov.br/servicos/diario-oficial-da-uniao/destaques-do-diario-oficial-da-uniao") {
    this.baseUrl = baseUrl;
  }

  private formatDate(date: string): string {
    const [day, month, year] = date.split("/");
    return `${year}-${month}-${day}`;
  }

  private parseHighlight(article: Element): Highlight | null {
    const title = article.querySelector(".title")?.textContent;
    const url = article.querySelector(".title")?.getAttribute("href");
    const description = article.querySelector(".summary")?.textContent;
    const date = article.querySelector(".date")?.textContent;

    if (!title || !description || !date || !url) {
      return null;
    }

    return {
      text: description.replace(/\s+/g, " ").trim(),
      url,
      date,
      section: title,
    };
  }

  async getHighlights(targetDate: string): Promise<Highlight[]> {
    try {
      const response = await fetch(this.baseUrl);
      
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

      const highlights: Highlight[] = [];

      Array.from(articles.children).forEach((article) => {
        const highlight = this.parseHighlight(article);
        if (highlight) {
          highlights.push(highlight);
        }
      });

      // Filter highlights for the target date
      const formattedTargetDate = targetDate.split("-").reverse().join("/");
      return highlights.filter((h) => h.date === formattedTargetDate);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to fetch highlights: ${message}`);
    }
  }
} 