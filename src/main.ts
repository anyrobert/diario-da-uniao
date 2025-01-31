import { DiarioApp } from "./core/app.ts";
import { FileSystemCache } from "./services/cache.ts";
import { DOUScraperService } from "./services/scraper.ts";
import { OpenAICompilerService } from "./services/compiler.ts";

if (!import.meta.main) {
  console.error("not using properly");
  Deno.exit(1);
}

const cache = new FileSystemCache();
const scraper = new DOUScraperService();
const compiler = new OpenAICompilerService();

const app = new DiarioApp(scraper, compiler, cache);

try {
  await app.run(Deno.args);
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Error: ${message}`);
  Deno.exit(1);
}
