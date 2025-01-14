import OpenAI from "jsr:@openai/openai";
import { writeAllSync } from "jsr:@std/io";

import { Highlight } from "../scraper/index.ts";

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
  baseURL: Deno.env.get("OPENAI_BASE_URL"),
});

const prompt = `
    Você é um jornalista que escreve sobre notícias do Brasil.
    Você recebe uma lista de notícias e deve escrever um resumo sobre elas.
    Você escreve em markdown. E anexa links para as notícias
    Você sempre coloca as data e escreve no formato brasileiro.
    Você sempre cita todas as notícias e fontes.
    Você sempre coloca a DATA das notícias no COMEÇO do texto.
    Você será penalizado se não seguir as instruções.
`;

export async function compileHighlights(
  highlights: Highlight[],
  model: string
) {
  try {
    const stream = await openai.chat.completions.create({
      model,
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: JSON.stringify(highlights) },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    });

    let fullContent = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      writeAllSync(Deno.stdout, new TextEncoder().encode(content));
      fullContent += content;
    }

    if (!fullContent) {
      throw new Error("No content received from OpenAI");
    }

    return fullContent;
  } catch (error) {
    console.error("Error compiling highlights:", error);
    throw new Error(`Failed to compile highlights: ${error}`);
  }
}
