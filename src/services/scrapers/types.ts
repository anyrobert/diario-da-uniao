import { Highlight } from "../../types/index.ts";

export type Fetcher = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;

export interface DOUHighlightSource {
  readonly name: string;
  readonly purpose: "live" | "archive";
  getHighlights(targetDate: string): Promise<Highlight[]>;
}

export interface SourceBenchmarkResult {
  source: string;
  elapsedMs: number;
  total: number;
  error?: string;
}

export interface HighlightQualityIssue {
  index: number;
  reasons: string[];
}

export interface HighlightQualityReport {
  total: number;
  valid: number;
  invalid: number;
  completenessScore: number;
  issues: HighlightQualityIssue[];
}

export interface HighlightsPageSourceOptions {
  baseUrl?: string;
  fetchFn?: Fetcher;
}

export interface ConsultaSearchSourceOptions {
  baseUrl?: string;
  fetchFn?: Fetcher;
  query?: string;
  resultLimit?: number;
  sections?: string[];
}

export interface DOUScraperServiceOptions {
  sources?: DOUHighlightSource[];
  sourceOrder?: string[];
  fetchFn?: Fetcher;
  consulta?: ConsultaSearchSourceOptions;
  highlights?: HighlightsPageSourceOptions;
  clockNow?: () => number;
}
