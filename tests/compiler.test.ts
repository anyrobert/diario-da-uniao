import { assertEquals, assertRejects } from "jsr:@std/assert";
import { OpenAICompilerService } from "../src/services/compiler.ts";
import { Highlight } from "../src/types/index.ts";

class MockOpenAI {
  chat = {
    completions: {
      create: async () => ({
        async *[Symbol.asyncIterator]() {
          yield { choices: [{ delta: { content: "Test summary" } }] };
        },
      }),
    },
  };
}

Deno.test("OpenAICompilerService", async (t) => {
  const mockHighlights: Highlight[] = [
    {
      text: "Test highlight",
      url: "https://example.com",
      date: "28/12/2024",
      section: "Test Section",
    },
  ];

  await t.step("should compile highlights successfully with API key", async () => {
    const compiler = new OpenAICompilerService("test-key");
    // @ts-ignore: Mock implementation
    compiler.openai = new MockOpenAI();

    const compiled = await compiler.compileHighlights(mockHighlights);

    assertEquals(compiled.length, 1);
    assertEquals(compiled[0].summary, "Test summary");
    assertEquals(compiled[0].text, mockHighlights[0].text);
    assertEquals(compiled[0].url, mockHighlights[0].url);
    assertEquals(compiled[0].date, mockHighlights[0].date);
    assertEquals(compiled[0].section, mockHighlights[0].section);
  });

  await t.step("should compile highlights successfully with base URL", async () => {
    const compiler = new OpenAICompilerService(undefined, "http://localhost:1234");
    // @ts-ignore: Mock implementation
    compiler.openai = new MockOpenAI();

    const compiled = await compiler.compileHighlights(mockHighlights);

    assertEquals(compiled.length, 1);
    assertEquals(compiled[0].summary, "Test summary");
  });

  await t.step("should throw error when neither API key nor base URL is provided", async () => {
    await assertRejects(
      async () => {
        new OpenAICompilerService(undefined, undefined);
      },
      Error,
      "Either OpenAI API key or base URL is required"
    );
  });

  await t.step("should throw error when OpenAI returns no content", async () => {
    const compiler = new OpenAICompilerService(undefined, "http://localhost:1234");
    // @ts-ignore: Mock implementation
    compiler.openai = {
      chat: {
        completions: {
          create: async () => ({
            async *[Symbol.asyncIterator]() {
              yield { choices: [{ delta: { content: "" } }] };
            },
          }),
        },
      },
    };

    await assertRejects(
      () => compiler.compileHighlights(mockHighlights),
      Error,
      "Failed to compile highlights: No content received from OpenAI"
    );
  });
}); 