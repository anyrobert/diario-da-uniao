import { Highlight, ScraperService } from "../../types/index.ts";
import { roundMs, toErrorMessage } from "./helpers.ts";
import { DOUHighlightSource, SourceBenchmarkResult } from "./types.ts";

export class MultiSourceScraperService implements ScraperService {
  private readonly sourceRegistry: Map<string, DOUHighlightSource>;
  private readonly sourceOrder: string[];
  private readonly clockNow: () => number;

  constructor(
    sources: DOUHighlightSource[],
    sourceOrder: string[] = [],
    clockNow: () => number = () => performance.now(),
  ) {
    this.sourceRegistry = new Map(sources.map((source) => [source.name, source]));
    this.sourceOrder = sourceOrder;
    this.clockNow = clockNow;
  }

  private resolveOrderedSources(): DOUHighlightSource[] {
    const allSources = [...this.sourceRegistry.values()];
    if (this.sourceOrder.length === 0) {
      return allSources;
    }

    const ordered = this.sourceOrder
      .map((sourceName) => this.sourceRegistry.get(sourceName))
      .filter((source): source is DOUHighlightSource => Boolean(source));

    const selectedNames = new Set(ordered.map((source) => source.name));
    for (const source of allSources) {
      if (!selectedNames.has(source.name)) {
        ordered.push(source);
      }
    }

    return ordered;
  }

  async getHighlights(targetDate: string): Promise<Highlight[]> {
    const sources = this.resolveOrderedSources();
    if (sources.length === 0) {
      throw new Error("No scraper sources configured");
    }

    const errors: string[] = [];

    for (const source of sources) {
      try {
        const highlights = await source.getHighlights(targetDate);
        if (highlights.length > 0) {
          return highlights;
        }
      } catch (error: unknown) {
        errors.push(`[${source.name}] ${toErrorMessage(error)}`);
      }
    }

    if (errors.length === sources.length) {
      throw new Error(`Failed to fetch highlights from all sources: ${errors.join(" | ")}`);
    }

    return [];
  }

  async benchmarkSources(targetDate: string): Promise<SourceBenchmarkResult[]> {
    const results: SourceBenchmarkResult[] = [];
    const sources = this.resolveOrderedSources();

    for (const source of sources) {
      const startedAt = this.clockNow();
      try {
        const highlights = await source.getHighlights(targetDate);
        results.push({
          source: source.name,
          elapsedMs: roundMs(this.clockNow() - startedAt),
          total: highlights.length,
        });
      } catch (error: unknown) {
        results.push({
          source: source.name,
          elapsedMs: roundMs(this.clockNow() - startedAt),
          total: 0,
          error: toErrorMessage(error),
        });
      }
    }

    return results;
  }
}
