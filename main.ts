import { compileHighlights } from "./compiler/index.ts";
import { compose } from "./composer/index.ts";
import { exists } from "./helpers/exists.ts";
import { getHighlights } from "./scraper/index.ts";
import { isValidDate } from "./helpers/is-valid-date.ts";

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

  const hasTodayNote = await exists(`./notes/${date}.md`);

  if (!hasTodayNote) {
    const highlights = await getHighlights();

    const compiledHighlights = await compileHighlights(
      highlights.filter(
        (h) => h.date === new Date(date).toLocaleDateString("pt-BR")
      )
    );

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
