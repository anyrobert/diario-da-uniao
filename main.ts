import { compileHighlights } from "./compiler/index.ts";
import { compose } from "./composer/index.ts";
import { exists } from "./helpers/exists.ts";
import { getHighlights } from "./scraper/index.ts";
import { isValidDate } from "./helpers/is-valid-date.ts";

if (import.meta.main) {
  const input = Deno.args[0];
  let day = "";

  if (input && isValidDate(input)) {
    day = input;
  } else {
    day = `${new Date().getFullYear()}-${
      new Date().getMonth() + 1
    }-${new Date().getDate()}`;
  }

  const hasTodayNote = await exists(`./notes/${day}.md`);

  if (!hasTodayNote) {
    const highlights = await getHighlights();

    const result = await compileHighlights(
      highlights.filter(
        (h) => h.date === new Date(day).toLocaleDateString("pt-BR")
      )
    );

    if (!result) {
      throw new Error("Failed to compile highlights");
    }

    const composed = compose({
      date: day,
      highlights: result,
    });

    Deno.writeFileSync(`./notes/${day}.md`, new TextEncoder().encode(composed));
  }

  const note = Deno.readFileSync(`./notes/${day}.md`);

  Deno.stdout.writeSync(note);
}
