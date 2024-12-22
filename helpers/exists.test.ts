import { assertEquals } from "jsr:@std/assert";

import { exists } from "./exists.ts";

Deno.test("exists", async () => {
  {
    Deno.writeFileSync("./test.txt", new TextEncoder().encode("test"));

    const result = await exists("./test.txt");

    assertEquals(result, true);
  }
  {
    Deno.removeSync("./test.txt");

    const result = await exists("./test.txt");

    assertEquals(result, false);
  }
});
