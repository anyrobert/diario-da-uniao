import { assert, assertEquals, assertRejects } from "@std/assert";
import {
  ConsultaSearchSource,
  DOUScraperService,
  evaluateHighlightsQuality,
  HighlightsPageSource,
} from "../src/services/scraper.ts";

const TARGET_DATE = "2026-03-02";
const TARGET_BR_DATE = "02/03/2026";
const CONSULTA_SCRIPT_ID = "_br_com_seatecnologia_in_buscadou_BuscaDouPortlet_params";

const getInputUrl = (input: string | URL | Request): string => {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof URL) {
    return input.toString();
  }

  return input.url;
};

const createConsultaHtml = (jsonArray: unknown[]): string => {
  return `
<!doctype html>
<html>
  <body>
    <script id="${CONSULTA_SCRIPT_ID}">
      ${JSON.stringify({ jsonArray })}
    </script>
  </body>
</html>
`;
};

const createHighlightsHtml = (): string => {
  return `
<!doctype html>
<html>
  <body>
    <div class="lista-de-dou">
      <article>
        <a class="title" href="/web/dou/-/decreto-exemplo-1">Atos do Poder Executivo</a>
        <p class="summary">Texto de resumo com dados completos para validar qualidade do item um.</p>
        <span class="date">${TARGET_BR_DATE}</span>
      </article>
      <article>
        <a class="title" href="/web/dou/-/decreto-exemplo-2">Ministério da Educação</a>
        <p class="summary">Outro resumo com informação suficiente para testes e filtros de data.</p>
        <span class="date">${TARGET_BR_DATE}</span>
      </article>
      <article>
        <a class="title" href="/web/dou/-/decreto-exemplo-antigo">Item fora da data</a>
        <p class="summary">Este item não deve aparecer no resultado final do scraper.</p>
        <span class="date">01/03/2026</span>
      </article>
    </div>
  </body>
</html>
`;
};

Deno.test("DOUScraperService strategies", async (t) => {
  await t.step("parses highlights source and filters by date", async () => {
    const source = new HighlightsPageSource({
      fetchFn: async () => new Response(createHighlightsHtml()),
    });

    const highlights = await source.getHighlights(TARGET_DATE);

    assertEquals(highlights.length, 2);
    assertEquals(highlights[0].date, TARGET_BR_DATE);
    assertEquals(highlights[0].url, "https://www.in.gov.br/web/dou/-/decreto-exemplo-1");
  });

  await t.step("parses consulta source from embedded JSON payload", async () => {
    const source = new ConsultaSearchSource({
      query: "* ",
      fetchFn: async () =>
        new Response(
          createConsultaHtml([
            {
              title: "Atos do Poder Executivo",
              content: "Resumo estruturado da consulta para o decreto principal de hoje.",
              pubDate: TARGET_BR_DATE,
              urlTitle: "decreto-principal-hoje-123",
            },
            {
              title: "Item de outra data",
              content: "Esse resultado deve ser removido por filtro de data.",
              pubDate: "01/03/2026",
              urlTitle: "item-antigo-456",
            },
          ]),
        ),
    });

    const highlights = await source.getHighlights(TARGET_DATE);

    assertEquals(highlights.length, 1);
    assertEquals(highlights[0].section, "Atos do Poder Executivo");
    assertEquals(highlights[0].date, TARGET_BR_DATE);
    assertEquals(highlights[0].url, "https://www.in.gov.br/web/dou/-/decreto-principal-hoje-123");
  });

  await t.step("falls back to highlights when consulta returns empty", async () => {
    const fetchFn = async (input: string | URL | Request): Promise<Response> => {
      const url = getInputUrl(input);
      if (url.includes("/consulta/-/buscar/dou")) {
        return new Response(createConsultaHtml([]));
      }
      if (url.includes("/destaques-do-diario-oficial-da-uniao")) {
        return new Response(createHighlightsHtml());
      }
      return new Response(null, { status: 404 });
    };

    const scraper = new DOUScraperService({
      fetchFn,
      sourceOrder: ["consulta", "highlights"],
    });

    const highlights = await scraper.getHighlights(TARGET_DATE);
    assertEquals(highlights.length, 2);
    assertEquals(highlights[0].section, "Atos do Poder Executivo");
  });

  await t.step("returns benchmark timings for both sources", async () => {
    const fetchFn = async (input: string | URL | Request): Promise<Response> => {
      const url = getInputUrl(input);

      if (url.includes("/consulta/-/buscar/dou")) {
        await new Promise((resolve) => setTimeout(resolve, 35));
        return new Response(
          createConsultaHtml([
            {
              title: "Atos do Poder Executivo",
              content: "Resumo estruturado da consulta para benchmark.",
              pubDate: TARGET_BR_DATE,
              urlTitle: "consulta-benchmark",
            },
          ]),
        );
      }

      if (url.includes("/destaques-do-diario-oficial-da-uniao")) {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return new Response(createHighlightsHtml());
      }

      return new Response(null, { status: 404 });
    };

    const scraper = new DOUScraperService({
      fetchFn,
      sourceOrder: ["consulta", "highlights"],
    });

    const benchmark = await scraper.benchmarkSources(TARGET_DATE);
    const consulta = benchmark.find((item) => item.source === "consulta");
    const highlights = benchmark.find((item) => item.source === "highlights");

    assert(consulta !== undefined);
    assert(highlights !== undefined);
    assert(consulta.elapsedMs > highlights.elapsedMs);
  });

  await t.step("evaluates data quality for both source outputs", async () => {
    const consultaSource = new ConsultaSearchSource({
      fetchFn: async () =>
        new Response(
          createConsultaHtml([
            {
              title: "Atos do Poder Executivo",
              content: "Resumo estruturado da consulta com conteúdo suficiente para score.",
              pubDate: TARGET_BR_DATE,
              urlTitle: "consulta-qualidade-1",
            },
          ]),
        ),
    });

    const highlightsSource = new HighlightsPageSource({
      fetchFn: async () => new Response(createHighlightsHtml()),
    });

    const consultaHighlights = await consultaSource.getHighlights(TARGET_DATE);
    const pageHighlights = await highlightsSource.getHighlights(TARGET_DATE);

    const consultaReport = evaluateHighlightsQuality(consultaHighlights, TARGET_DATE);
    const pageReport = evaluateHighlightsQuality(pageHighlights, TARGET_DATE);

    assertEquals(consultaReport.invalid, 0);
    assertEquals(pageReport.invalid, 0);
    assertEquals(consultaReport.completenessScore, 1);
    assertEquals(pageReport.completenessScore, 1);
  });

  await t.step("throws when every source fails", async () => {
    const scraper = new DOUScraperService({
      fetchFn: async () => {
        throw new Error("network outage");
      },
      sourceOrder: ["consulta", "highlights"],
    });

    await assertRejects(
      () => scraper.getHighlights(TARGET_DATE),
      Error,
      "Failed to fetch highlights from all sources",
    );
  });
});
