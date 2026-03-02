import { parseArgs } from "@std/cli/parse-args";
import { DiarioApp } from "./core/app.ts";
import { FileSystemCache } from "./services/cache.ts";
import { DOUScraperService } from "./services/scraper.ts";
import { OpenAICompilerService } from "./services/compiler.ts";
import { CompilerService } from "./types/index.ts";
import { getOptionalEnv } from "./utils/env.ts";

if (!import.meta.main) {
  console.error("not using properly");
  Deno.exit(1);
}

const printHelp = (): void => {
  const text = `
DOU Daily Digest CLI

Usage:
  dou [options]

Options:
  --date=YYYY-MM-DD           Target date (default: today)
  --raw                       Print raw scraper JSON and exit
  --source-order=a,b          Source priority (default: consulta,highlights)
  --consulta-query=QUERY      Query used by consulta source (default: "* ")
  --consulta-limit=N          Max consulta results (default: 20)
  --model=NAME                AI model used for summary generation
  -h, --help                  Show this help

Environment fallback:
  SCRAPER_SOURCE_ORDER, SCRAPER_CONSULTA_QUERY, SCRAPER_CONSULTA_LIMIT, AI_MODEL, NOTES_DIR

Cache:
  Uses a temp directory automatically (TMPDIR/TMP/TEMP).
`.trim();
  console.log(text);
};

const flags = parseArgs(Deno.args, {
  string: ["source-order", "consulta-query", "consulta-limit", "model"],
  boolean: ["raw", "help"],
  alias: { h: "help" },
  default: { raw: false, help: false },
});

if (flags.help) {
  printHelp();
  Deno.exit(0);
}

const cache = new FileSystemCache();
const sourceOrder = (flags["source-order"] ?? getOptionalEnv("SCRAPER_SOURCE_ORDER") ??
  "consulta,highlights")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const consultaQuery = flags["consulta-query"] ?? getOptionalEnv("SCRAPER_CONSULTA_QUERY") ?? "* ";
const consultaLimit = Number(flags["consulta-limit"] ?? getOptionalEnv("SCRAPER_CONSULTA_LIMIT") ??
  "20");

const scraper = new DOUScraperService({
  sourceOrder,
  consulta: {
    query: consultaQuery,
    resultLimit: Number.isFinite(consultaLimit) && consultaLimit > 0 ? consultaLimit : 20,
  },
});

const compiler: CompilerService = flags.raw
  ? {
    compileHighlights: async () => {
      throw new Error("Compiler should not be called when --raw is enabled");
    },
  }
  : new OpenAICompilerService(undefined, undefined, flags.model);

const app = new DiarioApp(scraper, compiler, cache);

try {
  await app.run(Deno.args);
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  Deno.exit(1);
}
