import { parseArgs } from "jsr:@std/cli/parse-args";

import { compileHighlights } from "./compiler/index.ts";
import { compose } from "./composer/index.ts";
import { exists } from "./helpers/exists.ts";
import { getHighlights } from "./scraper/index.ts";
import { isValidDate } from "./helpers/is-valid-date.ts";
import { withCache } from "./cache/index.ts";

if (!import.meta.main) {
  Deno.exit(0);
}

const flags = parseArgs(Deno.args, {
  string: ["model", "date"],
  default: { model: "granite-3.1-8b-instruct" },
});

const dateFlag = flags.date;
const modelFlag = flags.model;

let date = "";

if (dateFlag && isValidDate(dateFlag)) {
  date = dateFlag;
} else {
  const day = String(new Date().getDate()).padStart(2, "0");
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  const year = String(new Date().getFullYear());
  date = `${year}-${month}-${day}`;
}
console.log(`fetching highlights for ${date}`);
const hasNote = await exists(`./notes/${date}.md`);

if (!hasNote) {
  const highlights = await withCache(getHighlights, `${date}`)();

  const brDate = date.split("-").reverse().join("/");

  const dateHighlights = highlights.filter((h) => h.date === brDate);

  if (dateHighlights.length === 0) {
    console.log(`no highlights for ${date}`);
    Deno.exit(0);
  }

  console.log(`there are ${dateHighlights.length} highlights for ${date}`);

  const compiledHighlights = await compileHighlights(
    dateHighlights,
    modelFlag
  );

  if (!compiledHighlights) {
    throw new Error("Failed to compile highlights");
  }

  const composed = compose({
    date,
    highlights: compiledHighlights,
  });

  Deno.writeFileSync(`./notes/${date}.md`, new TextEncoder().encode(composed));
}

const note = Deno.readFileSync(`./notes/${date}.md`);

Deno.stdout.writeSync(note);
