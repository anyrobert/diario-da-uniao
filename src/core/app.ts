import { parseArgs } from "@std/cli/parse-args";
import { Highlight, CacheService, ScraperService, CompilerService } from "../types/index.ts";
import { config } from "../config/config.ts";

export class DiarioApp {
  constructor(
    private readonly scraper: ScraperService,
    private readonly compiler: CompilerService,
    private readonly cache: CacheService
  ) {}

  private formatDate(date?: string): string {
    if (date && this.isValidDate(date)) {
      return date;
    }

    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear());
    return `${year}-${month}-${day}`;
  }

  private isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await Deno.stat(path);
      return true;
    } catch {
      return false;
    }
  }

  async run(args: string[] = []): Promise<void> {
    const flags = parseArgs(args, {
      string: ["model", "date"],
      default: { model: config.aiModel.model },
    });

    const date = this.formatDate(flags.date);
    console.log(`Fetching highlights for ${date}`);

    const notePath = `${config.notesDir}/${date}.md`;
    if (await this.fileExists(notePath)) {
      const note = await Deno.readTextFile(notePath);
      await Deno.stdout.write(new TextEncoder().encode(note));
      return;
    }

    const highlights = await this.cache.get<Highlight[]>(`highlights-${date}`) ??
      await this.scraper.getHighlights(date);

    if (!Array.isArray(highlights) || highlights.length === 0) {
      console.log(`No highlights found for ${date}`);
      return;
    }

    await this.cache.set(`highlights-${date}`, highlights);
    console.log(`Found ${highlights.length} highlights for ${date}`);


    const summary = await this.compiler.compileHighlights(highlights);
    const content = this.composeMarkdown(date, summary);
    await Deno.mkdir(config.notesDir, { recursive: true });
    await Deno.writeTextFile(notePath, content);
    await Deno.stdout.write(new TextEncoder().encode(content));
  }

  private composeMarkdown(date: string, summary: string): string {
    const [year, month, day] = date.split("-");
    const header = `# Destaques do Diário Oficial da União - ${day}/${month}/${year}\n\n`;
    return header + summary;
  }
} 