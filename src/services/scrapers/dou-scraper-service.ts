import { ConsultaSearchSource } from "./consulta-search-source.ts";
import { HighlightsPageSource } from "./highlights-page-source.ts";
import { MultiSourceScraperService } from "./multi-source-scraper.ts";
import { DOUScraperServiceOptions } from "./types.ts";

export class DOUScraperService extends MultiSourceScraperService {
  constructor(options: DOUScraperServiceOptions = {}) {
    const fetchFn = options.fetchFn ?? fetch;
    const sources = options.sources ??
      [
        new ConsultaSearchSource({
          ...options.consulta,
          fetchFn,
        }),
        new HighlightsPageSource({
          ...options.highlights,
          fetchFn,
        }),
      ];

    super(sources, options.sourceOrder, options.clockNow);
  }
}
