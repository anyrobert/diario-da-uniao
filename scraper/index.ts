import { DOMParser } from "jsr:@b-fuze/deno-dom";

const DOU_HIGHLIGHTS_URL =
  "https://www.in.gov.br/servicos/diario-oficial-da-uniao/destaques-do-diario-oficial-da-uniao";

export interface Highlight {
  title: string;
  link: string;
  description: string;
  date: string;
}

export async function getHighlights() {
  try {
    const res = await fetch(DOU_HIGHLIGHTS_URL);
    const html = await res.text();

    const doc = new DOMParser().parseFromString(html, "text/html");

    const highlights: Highlight[] = [];

    if (!doc) {
      throw new Error("Error parsing HTML");
    }

    const articles = doc.querySelector(".lista-de-dou");

    if (!articles) return [];

    Array.from(articles.children).forEach((article) => {
      const title = article.querySelector(".title")?.textContent;
      const link = article.querySelector(".title")?.getAttribute("href");
      const description = article.querySelector(".summary")?.textContent;
      const date = article.querySelector(".date")?.textContent;

      if (!title || !description || !date || !link) return;

      highlights.push({
        title,
        description: description.replace(/\s+/g, " ").trim(),
        date,
        link,
      });
    });

    if (highlights.length === 0) {
      throw new Error("No highlights found");
    }

    return highlights;
  } catch (error) {
    console.error(error);
    throw new Error("Error fetching highlights");
  }
}
