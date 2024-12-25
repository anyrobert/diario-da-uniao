import OpenAI from "jsr:@openai/openai";

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

export async function compileHighlights(highlights: Highlight[]) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: prompt },
      { role: "user", content: JSON.stringify(highlights) },
    ],
  });
  return response.choices[0].message.content;
}
