import { parseArgs } from "@std/cli/parse-args";
import { config } from "../config/config.ts";

interface CleanupResult {
  cleaned: string;
  duplicatedChunksRemoved: number;
  duplicatedCharsRemoved: number;
}

const MIN_DUPLICATE_CHARS = 120;
const MIN_DUPLICATE_RATIO = 0.2;

function getMinDuplicateLength(textLength: number): number {
  return Math.max(MIN_DUPLICATE_CHARS, Math.floor(textLength * MIN_DUPLICATE_RATIO));
}

function findDuplicatedSuffixStart(content: string): number {
  if (content.length < MIN_DUPLICATE_CHARS * 2) {
    return -1;
  }

  const minDuplicateLength = getMinDuplicateLength(content.length);
  const firstPossibleStart = Math.floor(content.length / 2);
  const lastPossibleStart = content.length - minDuplicateLength;

  for (let start = firstPossibleStart; start <= lastPossibleStart; start++) {
    const suffix = content.slice(start);
    const prefix = content.slice(0, start);

    if (prefix.includes(suffix)) {
      return start;
    }
  }

  return -1;
}

export function removeDuplicatedText(content: string): CleanupResult {
  const originalHasCRLF = content.includes("\r\n");
  const normalized = content.replaceAll("\r\n", "\n");
  const hasTrailingNewline = normalized.endsWith("\n");

  const duplicatedSuffixStart = findDuplicatedSuffixStart(normalized);
  if (duplicatedSuffixStart < 0) {
    return {
      cleaned: content,
      duplicatedChunksRemoved: 0,
      duplicatedCharsRemoved: 0,
    };
  }

  const duplicatedCharsRemoved = normalized.length - duplicatedSuffixStart;
  let cleaned = normalized.slice(0, duplicatedSuffixStart).trimEnd();

  if (hasTrailingNewline && cleaned.length > 0) {
    cleaned += "\n";
  }

  const restoredLineEndings = originalHasCRLF ? cleaned.replaceAll("\n", "\r\n") : cleaned;

  return {
    cleaned: restoredLineEndings,
    duplicatedChunksRemoved: 1,
    duplicatedCharsRemoved,
  };
}

async function listNotes(dir: string): Promise<string[]> {
  const files: string[] = [];

  for await (const entry of Deno.readDir(dir)) {
    if (entry.isFile && entry.name.endsWith(".md")) {
      files.push(`${dir}/${entry.name}`);
    }
  }

  files.sort();
  return files;
}

async function ensureDirectoryExists(path: string): Promise<void> {
  try {
    const stat = await Deno.stat(path);
    if (!stat.isDirectory) {
      throw new Error(`Path exists but is not a directory: ${path}`);
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(`Directory not found: ${path}`);
    }
    throw error;
  }
}

async function run(): Promise<void> {
  const flags = parseArgs(Deno.args, {
    string: ["dir"],
    boolean: ["dry-run", "help"],
    default: {
      dir: config.notesDir,
      "dry-run": false,
      help: false,
    },
  });

  if (flags.help) {
    console.log(
      [
        "Usage: deno run --allow-read --allow-write src/scripts/dedupe_notes.ts [options]",
        "",
        "Options:",
        "  --dir=<path>   Notes directory (default: notes or NOTES_DIR env)",
        "  --dry-run      Show files that would be cleaned without writing",
        "  --help         Show this help message",
      ].join("\n"),
    );
    return;
  }

  const notesDir = String(flags.dir);
  const dryRun = Boolean(flags["dry-run"]);

  await ensureDirectoryExists(notesDir);
  const notes = await listNotes(notesDir);

  let changedFiles = 0;
  let totalRemovedChars = 0;
  let totalRemovedChunks = 0;

  for (const notePath of notes) {
    const original = await Deno.readTextFile(notePath);
    const result = removeDuplicatedText(original);

    if (result.cleaned === original) {
      continue;
    }

    changedFiles += 1;
    totalRemovedChars += result.duplicatedCharsRemoved;
    totalRemovedChunks += result.duplicatedChunksRemoved;

    if (!dryRun) {
      await Deno.writeTextFile(notePath, result.cleaned);
    }

    const action = dryRun ? "Would clean" : "Cleaned";
    console.log(
      `${action}: ${notePath} (removed ${result.duplicatedChunksRemoved} duplicate block(s), ${result.duplicatedCharsRemoved} chars)`,
    );
  }

  if (changedFiles === 0) {
    console.log(`No duplicated text found in ${notes.length} note file(s).`);
    return;
  }

  const mode = dryRun ? "Dry run complete" : "Done";
  console.log(
    `${mode}: ${changedFiles}/${notes.length} file(s) updated, ${totalRemovedChunks} duplicate block(s) removed, ${totalRemovedChars} chars removed.`,
  );

  if (dryRun) {
    console.log("Run again without --dry-run to apply the changes.");
  }
}

if (import.meta.main) {
  try {
    await run();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error: ${message}`);
    Deno.exit(1);
  }
}
