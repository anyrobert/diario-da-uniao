import { compileHighlights } from "./compiler/index.ts";
import { compose } from "./composer/index.ts";
import { exists } from "./helpers/exists.ts";
import { getHighlights } from "./scraper/index.ts";
import { isValidDate } from "./helpers/is-valid-date.ts";
import { withCache } from "./cache/index.ts";

if (import.meta.main) {
  const input = Deno.args[0];
  let date = "";

  if (input && isValidDate(input)) {
    date = input;
  } else {
    date = `${new Date().getFullYear()}-${
      new Date().getMonth() + 1
    }-${new Date().getDate()}`;
  }
  console.log(`fetching highlights for ${date}`); 
  const hasTodayNote = await exists(`./notes/${date}.md`);

  if (!hasTodayNote) {
    const highlights = await withCache(getHighlights, `${date}`)();

    const brDate = date.split("-").reverse().join("/");

    const todayHighlights = highlights.filter((h) => h.date === brDate);

    if (todayHighlights.length === 0) {
      console.log("no highlights for today");
      Deno.exit(0);
    }

    console.log(`there are ${todayHighlights.length} highlights for today`);

    const compiledHighlights = await compileHighlights(todayHighlights);

    if (!compiledHighlights) {
      throw new Error("Failed to compile highlights");
    }

    const composed = compose({
      date,
      highlights: compiledHighlights,
    });

    Deno.writeFileSync(
      `./notes/${date}.md`,
      new TextEncoder().encode(composed)
    );
  }

  const note = Deno.readFileSync(`./notes/${date}.md`);

  Deno.stdout.writeSync(note);
}
