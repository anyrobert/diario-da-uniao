import { assertEquals } from "jsr:@std/assert";

import { isValidDate } from "./is-valid-date.ts";

Deno.test("isValidDate", () => {
  {
    const result = isValidDate("2024-12-22");
    assertEquals(result, true);
  }

  {
    const result = isValidDate("2024-12-32");
    assertEquals(result, false);
  }
});
