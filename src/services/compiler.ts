import OpenAI from "@openai/openai";
import { Highlight } from "../types/index.ts";
import { config } from "../config/config.ts";
import { getOptionalEnv } from "../utils/env.ts";

export interface CompilerService {
  compileHighlights(highlights: Highlight[]): Promise<string>;
}

export class OpenAICompilerService implements CompilerService {
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly systemPrompt: string;

  constructor(
    apiKey?: string,
    baseURL?: string,
    model = config.aiModel.model,
    openaiClient?: OpenAI
  ) {
    if (openaiClient) {
      this.openai = openaiClient;
    } else {
      const resolvedApiKey = apiKey ?? getOptionalEnv("OPENAI_API_KEY");
      const resolvedBaseURL = baseURL ?? getOptionalEnv("OPENAI_BASE_URL");

      if (!resolvedApiKey && !resolvedBaseURL) {
        throw new Error("Either OpenAI API key or base URL is required");
      }

      // For local models, we need to provide a dummy API key
      const options: { apiKey?: string; baseURL?: string } = {};
      if (resolvedApiKey) {
        options.apiKey = resolvedApiKey;
      }
      if (resolvedBaseURL) {
        options.baseURL = resolvedBaseURL;
        if (!resolvedApiKey) {
          options.apiKey = "dummy-key-for-local-model";
        }
      }

      this.openai = new OpenAI(options);
    }
    this.model = model;
    this.systemPrompt = `
      Você é um jornalista que escreve sobre notícias do Brasil.
      Você recebe uma lista de notícias e deve escrever um resumo sobre elas.
      Você escreve em markdown. E anexa links para as notícias
      Você sempre coloca as data e escreve no formato brasileiro.
      Você sempre cita todas as notícias e fontes.
      Você sempre coloca a DATA das notícias no COMEÇO do texto.
      Você será penalizado se não seguir as instruções.
      Você não corta o texto e fala das principais notícias sem filtro.
    `.trim();
  }

  async compileHighlights(highlights: Highlight[]): Promise<string> {
    try {
      const stream = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: JSON.stringify(highlights) },
        ],
        temperature: config.aiModel.temperature ?? 0.7,
        max_tokens: config.aiModel.maxTokens ?? 2000,
        stream: true,
      });

      let fullContent = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        fullContent += content;
      }

      if (!fullContent) {
        throw new Error("No content received from OpenAI");
      }

      return fullContent;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to compile highlights: ${message}`);
    }
  }
} 