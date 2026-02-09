import { assertEquals, assertRejects } from "@std/assert";
import { OpenAICompilerService } from "../src/services/compiler.ts";
import { Highlight } from "../src/types/index.ts";

class MockOpenAI {
  constructor(private readonly chunks: string[]) {}

  chat = {
    completions: {
      create: async () => {
        const chunks: string[] = this.chunks;
        return {
          async *[Symbol.asyncIterator](): AsyncGenerator<{ choices: Array<{ delta: { content: string } }> }> {
            for (const chunk of chunks) {
              yield { choices: [{ delta: { content: chunk } }] };
            }
          },
        };
      },
    },
  };
}

const asOpenAI = (client: MockOpenAI): OpenAICompilerService["openai"] => {
  return client as unknown as OpenAICompilerService["openai"];
};

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
    const compiler = new OpenAICompilerService(
      "test-key",
      undefined,
      undefined,
      asOpenAI(new MockOpenAI(["Test summary"]))
    );

    const compiled = await compiler.compileHighlights(mockHighlights);

    assertEquals(compiled, "Test summary");
  });

  await t.step("should compile highlights successfully with base URL", async () => {
    const compiler = new OpenAICompilerService(
      undefined,
      "http://localhost:1234",
      undefined,
      asOpenAI(new MockOpenAI(["Test summary"]))
    );

    const compiled = await compiler.compileHighlights(mockHighlights);

    assertEquals(compiled, "Test summary");
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
    const compiler = new OpenAICompilerService(
      undefined,
      "http://localhost:1234",
      undefined,
      asOpenAI(new MockOpenAI([""]))
    );

    await assertRejects(
      () => compiler.compileHighlights(mockHighlights),
      Error,
      "Failed to compile highlights: No content received from OpenAI"
    );
  });

  await t.step("should concatenate streamed chunks into a single summary", async () => {
    const compiler = new OpenAICompilerService(
      undefined,
      "http://localhost:1234",
      undefined,
      asOpenAI(new MockOpenAI(["Parte 1", " e parte 2", "."]))
    );

    const compiled = await compiler.compileHighlights(mockHighlights);

    assertEquals(compiled, "Parte 1 e parte 2.");
  });
}); 