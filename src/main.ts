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

const cache = new FileSystemCache();
const sourceOrder = (getOptionalEnv("SCRAPER_SOURCE_ORDER") ?? "consulta,highlights")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);

const consultaQuery = getOptionalEnv("SCRAPER_CONSULTA_QUERY") ?? "* ";
const consultaLimit = Number(getOptionalEnv("SCRAPER_CONSULTA_LIMIT") ?? "20");

const scraper = new DOUScraperService({
  sourceOrder,
  consulta: {
    query: consultaQuery,
    resultLimit: Number.isFinite(consultaLimit) && consultaLimit > 0 ? consultaLimit : 20,
  },
});

const argsPreview = parseArgs(Deno.args, {
  boolean: ["raw"],
  default: { raw: false },
});

const compiler: CompilerService = argsPreview.raw
  ? {
    compileHighlights: async () => {
      throw new Error("Compiler should not be called when --raw is enabled");
    },
  }
  : new OpenAICompilerService();

const app = new DiarioApp(scraper, compiler, cache);

try {
  await app.run(Deno.args);
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  Deno.exit(1);
}
