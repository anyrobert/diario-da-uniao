export { CONSULTA_SCRIPT_ID } from "./constants.ts";
export {
  formatToBrazilianDate,
  formatToConsultaDate,
  isBrazilianDate,
  normalizeWhitespace,
  roundMs,
  stripHtml,
  toAbsoluteInUrl,
  toErrorMessage,
} from "./helpers.ts";
export { HighlightsPageSource } from "./highlights-page-source.ts";
export { ConsultaSearchSource } from "./consulta-search-source.ts";
export { MultiSourceScraperService } from "./multi-source-scraper.ts";
export { DOUScraperService } from "./dou-scraper-service.ts";
export { evaluateHighlightsQuality } from "./quality.ts";
export type {
  ConsultaSearchSourceOptions,
  DOUHighlightSource,
  DOUScraperServiceOptions,
  Fetcher,
  HighlightQualityIssue,
  HighlightQualityReport,
  HighlightsPageSourceOptions,
  SourceBenchmarkResult,
} from "./types.ts";
